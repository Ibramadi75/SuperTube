using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;

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
        // Only one download at a time to avoid SQLite "database is locked" errors
        if (_activeDownloads.Count > 0)
            return;

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var nextDownload = await db.Downloads
            .Where(d => d.Status == DownloadStatus.Pending)
            .OrderBy(d => d.StartedAt)
            .FirstOrDefaultAsync(stoppingToken);

        if (nextDownload != null && !_activeDownloads.ContainsKey(nextDownload.Id))
        {
            _ = ProcessDownloadAsync(nextDownload.Id, stoppingToken);
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

            var settings = await db.Settings.ToDictionaryAsync(s => s.Key, s => s.Value, cts.Token);

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

            var response = await _ytdlpService.StartDownloadAsync(request);
            var ytdlpId = response.Id;

            download.Status = DownloadStatus.Downloading;
            download.YtdlpId = ytdlpId;
            await db.SaveChangesAsync(cts.Token);

            await SendNotificationAsync(db, download.Url, status: "started");

            var startTime = DateTime.UtcNow;

            await foreach (var progress in _ytdlpService.StreamProgressAsync(ytdlpId, cts.Token))
            {
                download.Progress = (int)progress.Percent;
                download.Speed = progress.Speed;
                download.Eta = progress.Eta;
                download.FragmentIndex = progress.FragmentIndex;
                download.FragmentCount = progress.FragmentCount;

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

                var videoInfo = await _ytdlpService.GetVideoInfoAsync(download.Url);

                if (finalStatus.Result != null)
                {
                    await CreateVideoEntryAsync(db, finalStatus.Result, videoInfo?.Duration, download.Url, cts.Token);
                }

                var title = finalStatus.Result?.Title ?? download.Title ?? "Video";
                await SendNotificationAsync(db, title, status: "success");
            }
            else
            {
                download.Status = DownloadStatus.Failed;
                download.Error = finalStatus.Error ?? "Download failed";

                var title = download.Title ?? "Video";
                await SendNotificationAsync(db, title, status: "failed");
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

    private async Task CreateVideoEntryAsync(AppDbContext db, YtdlpDownloadResult result, int? duration, string youtubeUrl, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(result.VideoId) || string.IsNullOrEmpty(result.Filepath))
            return;

        var existing = await db.Videos.FindAsync(result.VideoId);
        if (existing != null) return;

        var filepath = result.Filepath;
        var fileInfo = new FileInfo(filepath);
        var thumbnailPath = filepath.Replace($".{result.Ext}", "-thumb.jpg");

        var video = new Video
        {
            Id = result.VideoId,
            Title = result.Title ?? "Unknown",
            Uploader = result.Uploader ?? "Unknown",
            Duration = duration,
            Filepath = filepath,
            ThumbnailPath = File.Exists(thumbnailPath) ? thumbnailPath : null,
            Filesize = fileInfo.Exists ? fileInfo.Length : null,
            DownloadedAt = DateTime.UtcNow,
            YoutubeUrl = youtubeUrl,
        };

        db.Videos.Add(video);
        await db.SaveChangesAsync(ct);

        _logger.LogInformation("Created video entry for {VideoId}: {Title} ({Duration}s)", video.Id, video.Title, duration);
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

    private async Task SendNotificationAsync(AppDbContext db, string message, string status = "success")
    {
        try
        {
            var enabled = await db.Settings.FindAsync("ntfy.enabled");
            var topic = await db.Settings.FindAsync("ntfy.topic");

            if (enabled?.Value != "true" || string.IsNullOrEmpty(topic?.Value))
                return;

            var (title, tag, body) = status switch
            {
                "started" => ("Video ajoutee", "arrow_down", "Telechargement commence"),
                "success" => ("Termine", "white_check_mark", message),
                "failed" => ("Echec", "x", message),
                _ => ("SuperTube", "bell", message)
            };

            var client = _httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Post, $"https://ntfy.sh/{topic.Value}");
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
