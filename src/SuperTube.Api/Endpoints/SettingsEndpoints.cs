using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;

namespace SuperTube.Api.Endpoints;

public static class SettingsEndpoints
{
    public static void MapSettingsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/settings");

        // GET /api/settings - Get all settings
        group.MapGet("/", async (AppDbContext db) =>
        {
            var settings = await db.Settings.ToDictionaryAsync(s => s.Key, s => s.Value);

            // Structure settings into groups
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
                }
            };

            return Results.Ok(new { data = structured });
        });

        // PUT /api/settings - Update settings
        group.MapPut("/", async (SettingsUpdateRequest request, AppDbContext db) =>
        {
            var updates = new Dictionary<string, string>();

            // Flatten the request into key-value pairs
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

            // Apply updates
            foreach (var (key, value) in updates)
            {
                var setting = await db.Settings.FindAsync(key);
                if (setting is not null)
                {
                    setting.Value = value;
                }
                else
                {
                    db.Settings.Add(new Setting { Key = key, Value = value });
                }
            }

            await db.SaveChangesAsync();

            return Results.Ok(new { data = new { updated = updates.Count } });
        });
    }
}

public record SettingsUpdateRequest(
    QualitySettings? Quality,
    FormatSettings? Format,
    PerformanceSettings? Performance,
    SponsorblockSettings? Sponsorblock
);

public record QualitySettings(string? Default);
public record FormatSettings(string? Video, string? Audio, bool? Thumbnail, bool? EmbedThumbnail);
public record PerformanceSettings(int? ConcurrentFragments, int? RateLimit, int? Retries);
public record SponsorblockSettings(bool? Enabled, string? Action, string[]? Categories);
