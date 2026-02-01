using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;

namespace SuperTube.Api.Endpoints;

public static class StatsEndpoints
{
    public static void MapStatsEndpoints(this WebApplication app)
    {
        // GET /api/stats - Global stats
        app.MapGet("/api/stats", async (AppDbContext db) =>
        {
            var totalVideos = await db.Videos.CountAsync();
            var totalSize = await db.Videos.SumAsync(v => v.Filesize ?? 0);
            var totalDuration = await db.Videos.SumAsync(v => v.Duration ?? 0);
            var channelCount = await db.Videos.Select(v => v.Uploader).Distinct().CountAsync();

            return Results.Ok(new
            {
                data = new
                {
                    totalVideos,
                    totalSize,
                    totalDuration,
                    channelCount,
                    formattedSize = FormatBytes(totalSize),
                    formattedDuration = FormatDuration(totalDuration)
                }
            });
        });

        // GET /api/stats/downloads - Download metrics
        app.MapGet("/api/stats/downloads", async (AppDbContext db) =>
        {
            var recentDownloads = await db.Downloads
                .Where(d => d.CompletedAt != null && d.CompletedAt > DateTime.UtcNow.AddDays(-30))
                .ToListAsync();

            var completed = recentDownloads.Where(d => d.Status == DownloadStatus.Completed).ToList();
            var failed = recentDownloads.Where(d => d.Status == DownloadStatus.Failed).ToList();

            var avgSpeed = completed.Any()
                ? completed.Where(d => d.AvgSpeedBytes > 0).Average(d => d.AvgSpeedBytes ?? 0)
                : 0;

            var avgDuration = completed.Any()
                ? completed.Where(d => d.DurationSeconds > 0).Average(d => d.DurationSeconds ?? 0)
                : 0;

            return Results.Ok(new
            {
                data = new
                {
                    last30Days = new
                    {
                        total = recentDownloads.Count,
                        completed = completed.Count,
                        failed = failed.Count,
                        successRate = recentDownloads.Count > 0
                            ? Math.Round((double)completed.Count / recentDownloads.Count * 100, 1)
                            : 0
                    },
                    averages = new
                    {
                        speedBytesPerSecond = (long)avgSpeed,
                        formattedSpeed = FormatBytes((long)avgSpeed) + "/s",
                        durationSeconds = (int)avgDuration
                    },
                    pending = await db.Downloads.CountAsync(d => d.Status == DownloadStatus.Pending),
                    inProgress = await db.Downloads.CountAsync(d => d.Status == DownloadStatus.Downloading)
                }
            });
        });

        // GET /api/webhook - Webhook configuration
        app.MapGet("/api/webhook", () =>
        {
            var token = Environment.GetEnvironmentVariable("WEBHOOK_TOKEN");
            var webhookHost = Environment.GetEnvironmentVariable("WEBHOOK_HOST") ?? "VOTRE_IP";
            var webhookPort = Environment.GetEnvironmentVariable("WEBHOOK_PORT") ?? "9001";

            return Results.Ok(new
            {
                data = new
                {
                    enabled = !string.IsNullOrEmpty(token),
                    token = token ?? "",
                    url = $"http://{webhookHost}:{webhookPort}/hooks/download"
                }
            });
        });

        // GET /api/storage - Storage info
        app.MapGet("/api/storage", () =>
        {
            var youtubeDir = Environment.GetEnvironmentVariable("YOUTUBE_PATH") ?? "/youtube";

            try
            {
                var driveInfo = new DriveInfo(Path.GetPathRoot(youtubeDir) ?? "/");

                return Results.Ok(new
                {
                    data = new
                    {
                        totalBytes = driveInfo.TotalSize,
                        freeBytes = driveInfo.AvailableFreeSpace,
                        usedBytes = driveInfo.TotalSize - driveInfo.AvailableFreeSpace,
                        formattedTotal = FormatBytes(driveInfo.TotalSize),
                        formattedFree = FormatBytes(driveInfo.AvailableFreeSpace),
                        formattedUsed = FormatBytes(driveInfo.TotalSize - driveInfo.AvailableFreeSpace),
                        percentUsed = Math.Round((double)(driveInfo.TotalSize - driveInfo.AvailableFreeSpace) / driveInfo.TotalSize * 100, 1)
                    }
                });
            }
            catch
            {
                return Results.Ok(new
                {
                    data = new
                    {
                        totalBytes = 0L,
                        freeBytes = 0L,
                        usedBytes = 0L,
                        formattedTotal = "N/A",
                        formattedFree = "N/A",
                        formattedUsed = "N/A",
                        percentUsed = 0.0
                    }
                });
            }
        });
    }

    private static string FormatBytes(long bytes)
    {
        string[] sizes = ["B", "Ko", "Mo", "Go", "To"];
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len /= 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }

    private static string FormatDuration(int totalSeconds)
    {
        var hours = totalSeconds / 3600;
        var minutes = (totalSeconds % 3600) / 60;
        return hours > 0 ? $"{hours}h {minutes}m" : $"{minutes}m";
    }
}
