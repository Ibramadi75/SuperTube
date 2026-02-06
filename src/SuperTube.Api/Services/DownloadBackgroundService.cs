using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;
using SuperTube.Api.Endpoints;

namespace SuperTube.Api.Services;

public class DownloadBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IYtdlpService _ytdlpService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<DownloadBackgroundService> _logger;
    private readonly Dictionary<string, CancellationTokenSource> _activeDownloads = new();

    public DownloadBackgroundService(
        IServiceScopeFactory scopeFactory,
        IYtdlpService ytdlpService,
        IHttpClientFactory httpClientFactory,
        ILogger<DownloadBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _ytdlpService = ytdlpService;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Download background service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingDownloadsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing downloads");
            }

            await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
        }
    }

    private async Task ProcessPendingDownloadsAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Get pending downloads
        var pendingDownloads = await db.Downloads
            .Where(d => d.Status == DownloadStatus.Pending)
            .OrderBy(d => d.StartedAt)
            .Take(3) // Max concurrent downloads
            .ToListAsync(stoppingToken);

        foreach (var download in pendingDownloads)
        {
            if (_activeDownloads.ContainsKey(download.Id))
                continue;

            _ = ProcessDownloadAsync(download.Id, stoppingToken);
        }
    }

    private async Task ProcessDownloadAsync(string downloadId, CancellationToken globalToken)
    {
        var cts = CancellationTokenSource.CreateLinkedTokenSource(globalToken);
        _activeDownloads[downloadId] = cts;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var download = await db.Downloads.FindAsync(downloadId);
            if (download == null) return;

            _logger.LogInformation("Starting download {DownloadId} for {Url}", downloadId, download.Url);

            // Get settings (user-specific with global fallback)
            Dictionary<string, string> settings;
            if (!string.IsNullOrEmpty(download.UserId))
            {
                settings = await SettingsEndpoints.GetMergedSettings(db, download.UserId);
            }
            else
            {
                settings = await db.Settings.ToDictionaryAsync(s => s.Key, s => s.Value, cts.Token);
            }

            // Build request
            var request = new YtdlpDownloadRequest
            {
                Url = download.Url,
                Quality = download.Quality ?? settings.GetValueOrDefault("quality", "1080"),
                Format = settings.GetValueOrDefault("format", "mp4"),
                ConcurrentFragments = download.ConcurrentFragments ?? int.Parse(settings.GetValueOrDefault("concurrent_fragments", "4")),
                Sponsorblock = bool.Parse(settings.GetValueOrDefault("sponsorblock", "true")),
                SponsorblockAction = settings.GetValueOrDefault("sponsorblock_action", "mark"),
                DownloadThumbnail = bool.Parse(settings.GetValueOrDefault("download_thumbnail", "true")),
            };

            // Start download on ytdlp-api
            var response = await _ytdlpService.StartDownloadAsync(request);
            var ytdlpId = response.Id;

            // Update status
            download.Status = DownloadStatus.Downloading;
            download.YtdlpId = ytdlpId;
            await db.SaveChangesAsync(cts.Token);

            // Send start notification
            await SendNotificationAsync(db, download.UserId, download.Url, status: "started");

            // Stream progress
            var startTime = DateTime.UtcNow;

            await foreach (var progress in _ytdlpService.StreamProgressAsync(ytdlpId, cts.Token))
            {
                download.Progress = (int)progress.Percent;
                download.Speed = progress.Speed;
                download.Eta = progress.Eta;
                download.FragmentIndex = progress.FragmentIndex;
                download.FragmentCount = progress.FragmentCount;

                // Calculate speed in bytes
                if (progress.Speed != null)
                {
                    download.AvgSpeedBytes = ParseSpeedToBytes(progress.Speed);
                }

                await db.SaveChangesAsync(cts.Token);

                if (progress.EventType == "complete")
                {
                    break;
                }
            }

            // Get final status
            var finalStatus = await _ytdlpService.GetDownloadStatusAsync(ytdlpId);
            if (finalStatus == null)
            {
                download.Status = DownloadStatus.Failed;
                download.Error = "Failed to get final status from ytdlp-api";
            }
            else if (finalStatus.Status == "completed")
            {
                download.Status = DownloadStatus.Completed;
                download.Progress = 100;
                download.CompletedAt = DateTime.UtcNow;
                download.DurationSeconds = (int)(DateTime.UtcNow - startTime).TotalSeconds;

                // Get video info for duration and channel info
                var videoInfo = await _ytdlpService.GetVideoInfoAsync(download.Url);

                // Create video entry
                if (finalStatus.Result != null)
                {
                    var video = await CreateVideoEntryAsync(db, finalStatus.Result, videoInfo, download.Url, download.UserId, cts.Token);

                    // Auto-subscribe if enabled
                    if (video != null && videoInfo != null)
                    {
                        await TryAutoSubscribeAsync(db, video, videoInfo, download.UserId, cts.Token);
                    }
                }

                // Send notification
                var title = finalStatus.Result?.Title ?? download.Title ?? "Video";
                await SendNotificationAsync(db, download.UserId, title, status: "success");
            }
            else
            {
                download.Status = DownloadStatus.Failed;
                download.Error = finalStatus.Error ?? "Download failed";

                // Send failure notification
                var title = download.Title ?? "Video";
                await SendNotificationAsync(db, download.UserId, title, status: "failed");
            }

            await db.SaveChangesAsync(cts.Token);
            _logger.LogInformation("Download {DownloadId} finished with status {Status}", downloadId, download.Status);
        }
        catch (OperationCanceledException)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var download = await db.Downloads.FindAsync(downloadId);
            if (download != null)
            {
                download.Status = DownloadStatus.Failed;
                download.Error = "Download cancelled";
                download.CompletedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing download {DownloadId}", downloadId);

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var download = await db.Downloads.FindAsync(downloadId);
            if (download != null)
            {
                download.Status = DownloadStatus.Failed;
                download.Error = ex.Message;
                download.CompletedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
            }
        }
        finally
        {
            _activeDownloads.Remove(downloadId);
            cts.Dispose();
        }
    }

    private async Task<Video?> CreateVideoEntryAsync(AppDbContext db, YtdlpDownloadResult result, YtdlpVideoInfo? videoInfo, string youtubeUrl, string? userId, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(result.VideoId) || string.IsNullOrEmpty(result.Filepath))
            return null;

        // Check if video already exists
        var existing = await db.Videos.FindAsync(result.VideoId);
        if (existing != null) return existing;

        var filepath = result.Filepath;
        var fileInfo = new FileInfo(filepath);

        // Build thumbnail path
        var thumbnailPath = filepath.Replace($".{result.Ext}", "-thumb.jpg");

        // Parse upload date
        DateTime? publishedAt = null;
        if (!string.IsNullOrEmpty(videoInfo?.UploadDate) && videoInfo.UploadDate.Length == 8)
        {
            if (DateTime.TryParseExact(videoInfo.UploadDate, "yyyyMMdd", null, System.Globalization.DateTimeStyles.None, out var parsed))
            {
                publishedAt = parsed;
            }
        }

        var video = new Video
        {
            Id = result.VideoId,
            Title = result.Title ?? "Unknown",
            Uploader = result.Uploader ?? "Unknown",
            Duration = videoInfo?.Duration,
            Filepath = filepath,
            ThumbnailPath = File.Exists(thumbnailPath) ? thumbnailPath : null,
            Filesize = fileInfo.Exists ? fileInfo.Length : null,
            DownloadedAt = DateTime.UtcNow,
            YoutubeUrl = youtubeUrl,
            PublishedAt = publishedAt,
            ChannelId = videoInfo?.ChannelId,
            UserId = userId,
        };

        db.Videos.Add(video);
        await db.SaveChangesAsync(ct);

        _logger.LogInformation("Created video entry for {VideoId}: {Title} ({Duration}s)", video.Id, video.Title, videoInfo?.Duration);
        return video;
    }

    private async Task TryAutoSubscribeAsync(AppDbContext db, Video video, YtdlpVideoInfo videoInfo, string? userId, CancellationToken ct)
    {
        try
        {
            if (string.IsNullOrEmpty(userId))
                return;

            // Check user-specific settings
            var settings = await SettingsEndpoints.GetMergedSettings(db, userId);

            if (settings.GetValueOrDefault("subscription.auto_subscribe", "true") != "true")
                return;

            if (settings.GetValueOrDefault("subscription.enabled", "true") != "true")
                return;

            if (string.IsNullOrEmpty(videoInfo.ChannelId))
                return;

            using var scope = _scopeFactory.CreateScope();
            var subscriptionService = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
            await subscriptionService.CreateFromVideoAsync(video, videoInfo, db, userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to auto-subscribe for video {VideoId}", video.Id);
        }
    }

    private static long? ParseSpeedToBytes(string speed)
    {
        // Parse strings like "8.2MiB/s", "512KiB/s"
        var match = System.Text.RegularExpressions.Regex.Match(speed, @"([\d.]+)\s*(K|M|G)?i?B/s", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (!match.Success) return null;

        if (!double.TryParse(match.Groups[1].Value, out var value))
            return null;

        var unit = match.Groups[2].Value.ToUpperInvariant();
        return unit switch
        {
            "K" => (long)(value * 1024),
            "M" => (long)(value * 1024 * 1024),
            "G" => (long)(value * 1024 * 1024 * 1024),
            _ => (long)value,
        };
    }

    public void CancelDownload(string downloadId)
    {
        if (_activeDownloads.TryGetValue(downloadId, out var cts))
        {
            cts.Cancel();
        }
    }

    private async Task SendNotificationAsync(AppDbContext db, string? userId, string message, string status = "success")
    {
        try
        {
            string enabledValue;
            string topicValue;

            if (!string.IsNullOrEmpty(userId))
            {
                var settings = await SettingsEndpoints.GetMergedSettings(db, userId);
                enabledValue = settings.GetValueOrDefault("ntfy.enabled", "false");
                topicValue = settings.GetValueOrDefault("ntfy.topic", "");
            }
            else
            {
                var enabled = await db.Settings.FindAsync("ntfy.enabled");
                var topic = await db.Settings.FindAsync("ntfy.topic");
                enabledValue = enabled?.Value ?? "false";
                topicValue = topic?.Value ?? "";
            }

            if (enabledValue != "true" || string.IsNullOrEmpty(topicValue))
                return;

            var (title, tag, body) = status switch
            {
                "started" => ("Video ajoutee", "arrow_down", "Telechargement commence"),
                "success" => ("Termine", "white_check_mark", message),
                "failed" => ("Echec", "x", message),
                _ => ("SuperTube", "bell", message)
            };

            var client = _httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Post, $"https://ntfy.sh/{topicValue}");
            request.Headers.Add("Title", title);
            request.Headers.Add("Tags", tag);
            request.Content = new StringContent(body);

            await client.SendAsync(request);
            _logger.LogInformation("Notification sent ({Status}): {Message}", status, message);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send notification");
        }
    }
}
