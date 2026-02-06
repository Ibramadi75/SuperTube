using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;
using SuperTube.Api.Services;

namespace SuperTube.Api.Endpoints;

public static class SettingsEndpoints
{
    public static void MapSettingsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/settings").RequireAuthorization();

        // GET /api/settings - Get all settings (user overrides with global fallback)
        group.MapGet("/", async (AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId()!;
            var settings = await GetMergedSettings(db, userId);

            var structured = new
            {
                quality = new
                {
                    @default = settings.GetValueOrDefault("quality.default", "1080p")
                },
                format = new
                {
                    video = settings.GetValueOrDefault("format.video", "mp4"),
                    audio = settings.GetValueOrDefault("format.audio", "mp3"),
                    thumbnail = settings.GetValueOrDefault("format.thumbnail", "true") == "true",
                    embedThumbnail = settings.GetValueOrDefault("format.embedThumbnail", "true") == "true"
                },
                performance = new
                {
                    concurrentFragments = int.Parse(settings.GetValueOrDefault("performance.concurrentFragments", "4")),
                    rateLimit = int.Parse(settings.GetValueOrDefault("performance.rateLimit", "0")),
                    retries = int.Parse(settings.GetValueOrDefault("performance.retries", "3"))
                },
                sponsorblock = new
                {
                    enabled = settings.GetValueOrDefault("sponsorblock.enabled", "true") == "true",
                    action = settings.GetValueOrDefault("sponsorblock.action", "mark"),
                    categories = settings.GetValueOrDefault("sponsorblock.categories", "sponsor,intro,outro").Split(',')
                },
                subscriptions = new
                {
                    enabled = settings.GetValueOrDefault("subscription.enabled", "true") == "true",
                    autoSubscribe = settings.GetValueOrDefault("subscription.auto_subscribe", "true") == "true",
                    cron = settings.GetValueOrDefault("subscription.cron", "0 * 9-21 * * *")
                }
            };

            return Results.Ok(new { data = structured });
        });

        // PUT /api/settings - Update settings (writes to UserSettings)
        group.MapPut("/", async (SettingsUpdateRequest request, AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId()!;
            var updates = new Dictionary<string, string>();

            if (request.Quality?.Default is not null)
                updates["quality.default"] = request.Quality.Default;

            if (request.Format?.Video is not null)
                updates["format.video"] = request.Format.Video;
            if (request.Format?.Audio is not null)
                updates["format.audio"] = request.Format.Audio;
            if (request.Format?.Thumbnail is not null)
                updates["format.thumbnail"] = request.Format.Thumbnail.Value.ToString().ToLower();
            if (request.Format?.EmbedThumbnail is not null)
                updates["format.embedThumbnail"] = request.Format.EmbedThumbnail.Value.ToString().ToLower();

            if (request.Performance?.ConcurrentFragments is not null)
                updates["performance.concurrentFragments"] = request.Performance.ConcurrentFragments.Value.ToString();
            if (request.Performance?.RateLimit is not null)
                updates["performance.rateLimit"] = request.Performance.RateLimit.Value.ToString();
            if (request.Performance?.Retries is not null)
                updates["performance.retries"] = request.Performance.Retries.Value.ToString();

            if (request.Sponsorblock?.Enabled is not null)
                updates["sponsorblock.enabled"] = request.Sponsorblock.Enabled.Value.ToString().ToLower();
            if (request.Sponsorblock?.Action is not null)
                updates["sponsorblock.action"] = request.Sponsorblock.Action;
            if (request.Sponsorblock?.Categories is not null)
                updates["sponsorblock.categories"] = string.Join(",", request.Sponsorblock.Categories);

            if (request.Subscriptions?.Enabled is not null)
                updates["subscription.enabled"] = request.Subscriptions.Enabled.Value.ToString().ToLower();
            if (request.Subscriptions?.AutoSubscribe is not null)
                updates["subscription.auto_subscribe"] = request.Subscriptions.AutoSubscribe.Value.ToString().ToLower();
            if (request.Subscriptions?.Cron is not null)
                updates["subscription.cron"] = request.Subscriptions.Cron;

            foreach (var (key, value) in updates)
            {
                var userSetting = await db.UserSettings.FindAsync(key, userId);
                if (userSetting is not null)
                {
                    userSetting.Value = value;
                }
                else
                {
                    db.UserSettings.Add(new UserSetting { Key = key, UserId = userId, Value = value });
                }
            }

            await db.SaveChangesAsync();

            return Results.Ok(new { data = new { updated = updates.Count } });
        });
    }

    public static async Task<Dictionary<string, string>> GetMergedSettings(AppDbContext db, string userId)
    {
        // Start with global defaults
        var globalSettings = await db.Settings.ToDictionaryAsync(s => s.Key, s => s.Value);

        // Override with user settings
        var userSettings = await db.UserSettings
            .Where(us => us.UserId == userId)
            .ToDictionaryAsync(us => us.Key, us => us.Value);

        foreach (var (key, value) in userSettings)
        {
            globalSettings[key] = value;
        }

        return globalSettings;
    }
}

public record SettingsUpdateRequest(
    QualitySettings? Quality,
    FormatSettings? Format,
    PerformanceSettings? Performance,
    SponsorblockSettings? Sponsorblock,
    SubscriptionsSettings? Subscriptions
);

public record QualitySettings(string? Default);
public record FormatSettings(string? Video, string? Audio, bool? Thumbnail, bool? EmbedThumbnail);
public record PerformanceSettings(int? ConcurrentFragments, int? RateLimit, int? Retries);
public record SponsorblockSettings(bool? Enabled, string? Action, string[]? Categories);
public record SubscriptionsSettings(bool? Enabled, bool? AutoSubscribe, string? Cron);
