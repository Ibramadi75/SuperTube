using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;

namespace SuperTube.Api.Services;

public interface ISubscriptionService
{
    Task<Subscription?> CreateFromVideoAsync(Video video, YtdlpVideoInfo videoInfo, AppDbContext db, string? userId);
    Task<Subscription?> CreateFromUrlAsync(string channelUrl, AppDbContext db, string? userId = null);
    Task<int> CheckSubscriptionAsync(string subscriptionId, AppDbContext db);
    Task<int> CheckAllSubscriptionsAsync(AppDbContext db, string? userId = null);
}

public class SubscriptionService : ISubscriptionService
{
    private readonly IYtdlpService _ytdlpService;
    private readonly ILogger<SubscriptionService> _logger;

    public SubscriptionService(IYtdlpService ytdlpService, ILogger<SubscriptionService> logger)
    {
        _ytdlpService = ytdlpService;
        _logger = logger;
    }

    public async Task<Subscription?> CreateFromVideoAsync(Video video, YtdlpVideoInfo videoInfo, AppDbContext db, string? userId)
    {
        if (string.IsNullOrEmpty(videoInfo.ChannelId) || string.IsNullOrEmpty(videoInfo.ChannelUrl))
        {
            _logger.LogWarning("Cannot create subscription: missing channel info for video {VideoId}", video.Id);
            return null;
        }

        // Check if subscription already exists for this user and channel
        var existing = await db.Subscriptions.FirstOrDefaultAsync(s => s.ChannelId == videoInfo.ChannelId && s.UserId == userId);
        if (existing != null)
        {
            _logger.LogDebug("Subscription already exists for channel {ChannelId}", videoInfo.ChannelId);
            return existing;
        }

        // Parse upload date
        var lastVideoDate = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(videoInfo.UploadDate) && videoInfo.UploadDate.Length == 8)
        {
            if (DateTime.TryParseExact(videoInfo.UploadDate, "yyyyMMdd", null, System.Globalization.DateTimeStyles.None, out var parsed))
            {
                lastVideoDate = parsed;
            }
        }

        var subscription = new Subscription
        {
            Id = Guid.NewGuid().ToString()[..12],
            ChannelId = videoInfo.ChannelId,
            ChannelName = video.Uploader,
            ChannelUrl = videoInfo.ChannelUrl,
            IsActive = true,
            SubscribedAt = DateTime.UtcNow,
            LastVideoDate = lastVideoDate,
            TotalDownloaded = 1,
            UserId = userId
        };

        db.Subscriptions.Add(subscription);
        await db.SaveChangesAsync();

        _logger.LogInformation("Created subscription for channel {ChannelName} ({ChannelId})", subscription.ChannelName, subscription.ChannelId);

        // Immediately check for newer videos (between downloaded video and today)
        var newVideos = await CheckSubscriptionAsync(subscription.Id, db);
        if (newVideos > 0)
        {
            _logger.LogInformation("Queued {Count} newer videos from {ChannelName} after initial subscription", newVideos, subscription.ChannelName);
        }

        return subscription;
    }

    public async Task<Subscription?> CreateFromUrlAsync(string channelUrl, AppDbContext db, string? userId = null)
    {
        // Get channel info by fetching a video from the channel
        var videos = await _ytdlpService.GetChannelVideosAsync(channelUrl);
        if (videos.Count == 0)
        {
            _logger.LogWarning("No videos found for channel {Url}", channelUrl);
            return null;
        }

        var firstVideo = videos[0];
        if (string.IsNullOrEmpty(firstVideo.Url))
            return null;

        var videoInfo = await _ytdlpService.GetVideoInfoAsync(firstVideo.Url);
        if (videoInfo == null || string.IsNullOrEmpty(videoInfo.ChannelId))
        {
            _logger.LogWarning("Failed to get channel info from video");
            return null;
        }

        // Check if subscription already exists for this user and channel
        var existing = await db.Subscriptions.FirstOrDefaultAsync(s => s.ChannelId == videoInfo.ChannelId && s.UserId == userId);
        if (existing != null)
            return existing;

        var subscription = new Subscription
        {
            Id = Guid.NewGuid().ToString()[..12],
            ChannelId = videoInfo.ChannelId,
            ChannelName = videoInfo.Uploader ?? "Unknown",
            ChannelUrl = videoInfo.ChannelUrl ?? channelUrl,
            IsActive = true,
            SubscribedAt = DateTime.UtcNow,
            LastVideoDate = DateTime.UtcNow,
            TotalDownloaded = 0,
            UserId = userId
        };

        db.Subscriptions.Add(subscription);
        await db.SaveChangesAsync();

        _logger.LogInformation("Created subscription for channel {ChannelName} from URL", subscription.ChannelName);
        return subscription;
    }

    public async Task<int> CheckSubscriptionAsync(string subscriptionId, AppDbContext db)
    {
        var subscription = await db.Subscriptions.FindAsync(subscriptionId);
        if (subscription == null || !subscription.IsActive)
            return 0;

        _logger.LogInformation("Checking subscription {ChannelName} for new videos", subscription.ChannelName);

        // Format since_date as YYYYMMDD
        var sinceDate = subscription.LastVideoDate.ToString("yyyyMMdd");
        var videos = await _ytdlpService.GetChannelVideosAsync(subscription.ChannelUrl, sinceDate);

        if (videos.Count == 0)
        {
            subscription.LastCheckedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            _logger.LogInformation("No new videos found for {ChannelName}", subscription.ChannelName);
            return 0;
        }

        var newDownloads = 0;
        DateTime? latestVideoDate = null;

        foreach (var video in videos)
        {
            if (string.IsNullOrEmpty(video.Id) || string.IsNullOrEmpty(video.Url))
                continue;

            // Skip if video already downloaded
            var existingVideo = await db.Videos.FindAsync(video.Id);
            if (existingVideo != null)
                continue;

            // Skip if download already exists
            var existingDownload = await db.Downloads.FirstOrDefaultAsync(d => d.Url == video.Url);
            if (existingDownload != null)
                continue;

            // Parse upload date
            DateTime? uploadDate = null;
            if (!string.IsNullOrEmpty(video.UploadDate) && video.UploadDate.Length == 8)
            {
                if (DateTime.TryParseExact(video.UploadDate, "yyyyMMdd", null, System.Globalization.DateTimeStyles.None, out var parsed))
                {
                    uploadDate = parsed;
                    if (latestVideoDate == null || parsed > latestVideoDate)
                        latestVideoDate = parsed;
                }
            }

            // Create download - inherit UserId from subscription
            var download = new Download
            {
                Id = Guid.NewGuid().ToString()[..12],
                Url = video.Url,
                Status = DownloadStatus.Pending,
                Title = video.Title,
                Uploader = subscription.ChannelName,
                StartedAt = DateTime.UtcNow,
                UserId = subscription.UserId
            };

            db.Downloads.Add(download);
            newDownloads++;
            _logger.LogInformation("Queued download for new video: {Title}", video.Title);
        }

        subscription.LastCheckedAt = DateTime.UtcNow;
        if (latestVideoDate.HasValue)
            subscription.LastVideoDate = latestVideoDate.Value;
        subscription.TotalDownloaded += newDownloads;

        await db.SaveChangesAsync();

        _logger.LogInformation("Found {Count} new videos for {ChannelName}", newDownloads, subscription.ChannelName);
        return newDownloads;
    }

    public async Task<int> CheckAllSubscriptionsAsync(AppDbContext db, string? userId = null)
    {
        var query = db.Subscriptions.Where(s => s.IsActive);
        if (userId != null)
            query = query.Where(s => s.UserId == userId);

        var subscriptions = await query.ToListAsync();

        var totalNewDownloads = 0;

        foreach (var subscription in subscriptions)
        {
            try
            {
                var count = await CheckSubscriptionAsync(subscription.Id, db);
                totalNewDownloads += count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking subscription {ChannelName}", subscription.ChannelName);
            }
        }

        _logger.LogInformation("Checked {Count} subscriptions, found {NewVideos} new videos", subscriptions.Count, totalNewDownloads);
        return totalNewDownloads;
    }
}
