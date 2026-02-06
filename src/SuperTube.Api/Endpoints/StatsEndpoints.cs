using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;
using SuperTube.Api.Services;

namespace SuperTube.Api.Endpoints;

public static class StatsEndpoints
{
    public static void MapStatsEndpoints(this WebApplication app)
    {
        // GET /api/stats - Global stats (filtered by user)
        app.MapGet("/api/stats", async (AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId();
            var totalVideos = await db.Videos.CountAsync(v => v.UserId == userId);
            var totalSize = await db.Videos.Where(v => v.UserId == userId).SumAsync(v => v.Filesize ?? 0);
            var totalDuration = await db.Videos.Where(v => v.UserId == userId).SumAsync(v => v.Duration ?? 0);
            var channelCount = await db.Videos.Where(v => v.UserId == userId).Select(v => v.Uploader).Distinct().CountAsync();

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
        }).RequireAuthorization();

        // GET /api/stats/downloads - Download metrics (filtered by user)
        app.MapGet("/api/stats/downloads", async (AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId();
            var recentDownloads = await db.Downloads
                .Where(d => d.UserId == userId && d.CompletedAt != null && d.CompletedAt > DateTime.UtcNow.AddDays(-30))
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
                    pending = await db.Downloads.CountAsync(d => d.UserId == userId && d.Status == DownloadStatus.Pending),
                    inProgress = await db.Downloads.CountAsync(d => d.UserId == userId && d.Status == DownloadStatus.Downloading)
                }
            });
        }).RequireAuthorization();

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
        }).RequireAuthorization();

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
        }).RequireAuthorization();

        // POST /api/webhook/verify - Verify webhook token as JWT (called by webhook container, no auth)
        app.MapPost("/api/webhook/verify", async (TokenVerifyRequest request, AppDbContext db) =>
        {
            var tokenEnabled = await db.Settings.FindAsync("webhook.tokenEnabled");

            // If token not required, always valid
            if (tokenEnabled?.Value != "true")
            {
                return Results.Ok(new { valid = true });
            }

            if (string.IsNullOrEmpty(request.Token))
                return Results.Ok(new { valid = false });

            try
            {
                var handler = new JwtSecurityTokenHandler();
                if (!handler.CanReadToken(request.Token))
                    return Results.Ok(new { valid = false });

                var jwt = handler.ReadJwtToken(request.Token);
                var userId = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "nameid")?.Value;
                if (userId is null)
                    return Results.Ok(new { valid = false });

                var user = await db.Users.FindAsync(userId);
                if (user?.JwtSecret is null)
                    return Results.Ok(new { valid = false });

                var isValid = AuthService.ValidateTokenSignature(request.Token, user.JwtSecret);
                return Results.Ok(new { valid = isValid });
            }
            catch
            {
                return Results.Ok(new { valid = false });
            }
        }).AllowAnonymous();

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
        }).RequireAuthorization();

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
        }).RequireAuthorization();

        // GET /api/ntfy - Ntfy configuration
        app.MapGet("/api/ntfy", async (AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId()!;
            var settings = await SettingsEndpoints.GetMergedSettings(db, userId);

            return Results.Ok(new
            {
                data = new
                {
                    enabled = settings.GetValueOrDefault("ntfy.enabled", "false") == "true",
                    topic = settings.GetValueOrDefault("ntfy.topic", "")
                }
            });
        }).RequireAuthorization();

        // PUT /api/ntfy - Update ntfy settings
        app.MapPut("/api/ntfy", async (NtfyUpdateRequest request, AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId()!;

            var enabledSetting = await db.UserSettings.FindAsync("ntfy.enabled", userId);
            var topicSetting = await db.UserSettings.FindAsync("ntfy.topic", userId);

            if (enabledSetting is not null)
                enabledSetting.Value = request.Enabled.ToString().ToLower();
            else
                db.UserSettings.Add(new UserSetting { Key = "ntfy.enabled", UserId = userId, Value = request.Enabled.ToString().ToLower() });

            if (topicSetting is not null)
                topicSetting.Value = request.Topic ?? "";
            else
                db.UserSettings.Add(new UserSetting { Key = "ntfy.topic", UserId = userId, Value = request.Topic ?? "" });

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                data = new
                {
                    enabled = request.Enabled,
                    topic = request.Topic ?? ""
                }
            });
        }).RequireAuthorization();

        // POST /api/ntfy/test - Send test notification
        app.MapPost("/api/ntfy/test", async (AppDbContext db, HttpContext httpContext, HttpClient httpClient) =>
        {
            var userId = httpContext.GetUserId()!;
            var settings = await SettingsEndpoints.GetMergedSettings(db, userId);

            var enabled = settings.GetValueOrDefault("ntfy.enabled", "false") == "true";
            var topic = settings.GetValueOrDefault("ntfy.topic", "");

            if (!enabled || string.IsNullOrEmpty(topic))
            {
                return Results.BadRequest(new { error = "Ntfy not configured" });
            }

            try
            {
                var response = await httpClient.PostAsync(
                    $"https://ntfy.sh/{topic}",
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
        }).RequireAuthorization();

        // GET /api/storage - Storage info (global, not filtered by user)
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
        }).RequireAuthorization();
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
