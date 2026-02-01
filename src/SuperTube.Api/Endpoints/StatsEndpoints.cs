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
        app.MapGet("/api/webhook", async (AppDbContext db) =>
        {
            var webhookPort = Environment.GetEnvironmentVariable("WEBHOOK_PORT") ?? "9001";

            var tokenEnabled = await db.Settings.FindAsync("webhook.tokenEnabled");
            var tokenValue = await db.Settings.FindAsync("webhook.token");

            var requiresToken = tokenEnabled?.Value == "true";
            var token = requiresToken ? (tokenValue?.Value ?? "") : "";

            return Results.Ok(new
            {
                data = new
                {
                    enabled = true,
                    requiresToken,
                    token,
                    port = webhookPort
                }
            });
        });

        // PUT /api/webhook - Update webhook settings
        app.MapPut("/api/webhook", async (WebhookUpdateRequest request, AppDbContext db) =>
        {
            var tokenEnabled = await db.Settings.FindAsync("webhook.tokenEnabled");
            var tokenValue = await db.Settings.FindAsync("webhook.token");

            if (tokenEnabled is not null)
            {
                tokenEnabled.Value = request.RequireToken.ToString().ToLower();
            }
            else
            {
                db.Settings.Add(new Setting { Key = "webhook.tokenEnabled", Value = request.RequireToken.ToString().ToLower() });
            }

            // Generate new token if enabling and no token exists
            if (request.RequireToken && (tokenValue is null || string.IsNullOrEmpty(tokenValue.Value)))
            {
                var newToken = GenerateToken();
                if (tokenValue is not null)
                {
                    tokenValue.Value = newToken;
                }
                else
                {
                    db.Settings.Add(new Setting { Key = "webhook.token", Value = newToken });
                }
            }

            await db.SaveChangesAsync();

            var webhookPort = Environment.GetEnvironmentVariable("WEBHOOK_PORT") ?? "9001";
            var finalToken = request.RequireToken ? (await db.Settings.FindAsync("webhook.token"))?.Value ?? "" : "";

            return Results.Ok(new
            {
                data = new
                {
                    enabled = true,
                    requiresToken = request.RequireToken,
                    token = finalToken,
                    port = webhookPort
                }
            });
        });

        // POST /api/webhook/verify - Verify webhook token (called by webhook container)
        app.MapPost("/api/webhook/verify", async (TokenVerifyRequest request, AppDbContext db) =>
        {
            var tokenEnabled = await db.Settings.FindAsync("webhook.tokenEnabled");
            var tokenValue = await db.Settings.FindAsync("webhook.token");

            // If token not required, always valid
            if (tokenEnabled?.Value != "true")
            {
                return Results.Ok(new { valid = true });
            }

            var isValid = !string.IsNullOrEmpty(request.Token) && request.Token == tokenValue?.Value;
            return Results.Ok(new { valid = isValid });
        });

        // POST /api/webhook/regenerate - Generate a new token
        app.MapPost("/api/webhook/regenerate", async (AppDbContext db) =>
        {
            var tokenValue = await db.Settings.FindAsync("webhook.token");
            var newToken = GenerateToken();

            if (tokenValue is not null)
            {
                tokenValue.Value = newToken;
            }
            else
            {
                db.Settings.Add(new Setting { Key = "webhook.token", Value = newToken });
            }

            await db.SaveChangesAsync();

            return Results.Ok(new { data = new { token = newToken } });
        });

        // PUT /api/webhook/token - Set token manually
        app.MapPut("/api/webhook/token", async (SetTokenRequest request, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(request.Token))
            {
                return Results.BadRequest(new { error = "Token cannot be empty" });
            }

            var tokenValue = await db.Settings.FindAsync("webhook.token");

            if (tokenValue is not null)
            {
                tokenValue.Value = request.Token;
            }
            else
            {
                db.Settings.Add(new Setting { Key = "webhook.token", Value = request.Token });
            }

            await db.SaveChangesAsync();

            return Results.Ok(new { data = new { token = request.Token } });
        });

        // GET /api/ntfy - Ntfy configuration
        app.MapGet("/api/ntfy", async (AppDbContext db) =>
        {
            var enabled = await db.Settings.FindAsync("ntfy.enabled");
            var topic = await db.Settings.FindAsync("ntfy.topic");

            return Results.Ok(new
            {
                data = new
                {
                    enabled = enabled?.Value == "true",
                    topic = topic?.Value ?? ""
                }
            });
        });

        // PUT /api/ntfy - Update ntfy settings
        app.MapPut("/api/ntfy", async (NtfyUpdateRequest request, AppDbContext db) =>
        {
            var enabled = await db.Settings.FindAsync("ntfy.enabled");
            var topic = await db.Settings.FindAsync("ntfy.topic");

            if (enabled is not null)
                enabled.Value = request.Enabled.ToString().ToLower();
            else
                db.Settings.Add(new Setting { Key = "ntfy.enabled", Value = request.Enabled.ToString().ToLower() });

            if (topic is not null)
                topic.Value = request.Topic ?? "";
            else
                db.Settings.Add(new Setting { Key = "ntfy.topic", Value = request.Topic ?? "" });

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                data = new
                {
                    enabled = request.Enabled,
                    topic = request.Topic ?? ""
                }
            });
        });

        // POST /api/ntfy/test - Send test notification
        app.MapPost("/api/ntfy/test", async (AppDbContext db, HttpClient httpClient) =>
        {
            var enabled = await db.Settings.FindAsync("ntfy.enabled");
            var topic = await db.Settings.FindAsync("ntfy.topic");

            if (enabled?.Value != "true" || string.IsNullOrEmpty(topic?.Value))
            {
                return Results.BadRequest(new { error = "Ntfy not configured" });
            }

            try
            {
                var response = await httpClient.PostAsync(
                    $"https://ntfy.sh/{topic.Value}",
                    new StringContent("Test notification from SuperTube!")
                );

                if (response.IsSuccessStatusCode)
                    return Results.Ok(new { success = true });
                else
                    return Results.BadRequest(new { error = "Failed to send notification" });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
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

    private static string GenerateToken()
    {
        var bytes = new byte[24];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }
}

public record WebhookUpdateRequest(bool RequireToken);
public record TokenVerifyRequest(string Token);
public record SetTokenRequest(string Token);
public record NtfyUpdateRequest(bool Enabled, string? Topic);
