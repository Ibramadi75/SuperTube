using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;
using SuperTube.Api.Services;

namespace SuperTube.Api.Endpoints;

public static class DownloadEndpoints
{
    public static void MapDownloadEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/downloads").RequireAuthorization();

        // GET /api/downloads - List all downloads
        group.MapGet("/", async (AppDbContext db, HttpContext httpContext, string? status) =>
        {
            var userId = httpContext.GetUserId();
            var query = db.Downloads
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.StartedAt)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<DownloadStatus>(status, true, out var statusEnum))
            {
                query = query.Where(d => d.Status == statusEnum);
            }

            var downloads = await query.ToListAsync();
            return Results.Ok(new { data = downloads });
        });

        // GET /api/downloads/{id} - Get download by ID
        group.MapGet("/{id}", async (string id, AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId();
            var download = await db.Downloads.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
            return download is not null
                ? Results.Ok(new { data = download })
                : Results.NotFound(new { error = new { code = "DOWNLOAD_NOT_FOUND", message = $"Download '{id}' not found" } });
        });

        // POST /api/downloads - Start a new download
        group.MapPost("/", async (DownloadRequest request, AppDbContext db, HttpContext httpContext) =>
        {
            if (string.IsNullOrWhiteSpace(request.Url))
                return Results.BadRequest(new { error = new { code = "INVALID_URL", message = "URL is required" } });

            if (!IsValidYouTubeUrl(request.Url))
                return Results.BadRequest(new { error = new { code = "INVALID_URL", message = "Invalid YouTube URL" } });

            var userId = httpContext.GetUserId()!;

            // Check storage quota
            var user = await db.Users.FindAsync(userId);
            if (user?.StorageQuotaBytes is not null)
            {
                var used = await CurrentUserExtensions.GetUserStorageUsedBytes(db, userId);
                if (used >= user.StorageQuotaBytes.Value)
                    return Results.BadRequest(new { error = new { code = "QUOTA_EXCEEDED", message = "Storage quota exceeded" } });
            }

            var download = new Download
            {
                Id = Guid.NewGuid().ToString("N")[..12],
                Url = request.Url,
                Status = DownloadStatus.Pending,
                Progress = 0,
                StartedAt = DateTime.UtcNow,
                Quality = request.Quality ?? "1080p",
                ConcurrentFragments = request.ConcurrentFragments ?? 4,
                UserId = userId
            };

            db.Downloads.Add(download);
            await db.SaveChangesAsync();

            return Results.Created($"/api/downloads/{download.Id}", new { data = download });
        });

        // DELETE /api/downloads/{id} - Cancel a download
        group.MapDelete("/{id}", async (string id, AppDbContext db, HttpContext httpContext, DownloadBackgroundService backgroundService, IYtdlpService ytdlpService) =>
        {
            var userId = httpContext.GetUserId();
            var download = await db.Downloads.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
            if (download is null)
                return Results.NotFound(new { error = new { code = "DOWNLOAD_NOT_FOUND", message = $"Download '{id}' not found" } });

            if (download.Status == DownloadStatus.Completed)
                return Results.BadRequest(new { error = new { code = "ALREADY_COMPLETED", message = "Cannot cancel a completed download" } });

            backgroundService.CancelDownload(id);

            if (!string.IsNullOrEmpty(download.YtdlpId))
            {
                try
                {
                    await ytdlpService.CancelDownloadAsync(download.YtdlpId);
                }
                catch
                {
                    // Ignore errors - download may already be cancelled
                }
            }

            download.Status = DownloadStatus.Failed;
            download.Error = "Cancelled by user";
            download.CompletedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(new { data = download });
        });

        // GET /api/downloads/{id}/progress - SSE stream for real-time progress
        group.MapGet("/{id}/progress", async (string id, AppDbContext db, HttpContext httpContext, CancellationToken ct) =>
        {
            var userId = httpContext.GetUserId();
            var download = await db.Downloads.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId, ct);
            if (download is null)
            {
                httpContext.Response.StatusCode = 404;
                await httpContext.Response.WriteAsJsonAsync(new { error = new { code = "DOWNLOAD_NOT_FOUND", message = $"Download '{id}' not found" } }, ct);
                return;
            }

            httpContext.Response.Headers["Content-Type"] = "text/event-stream";
            httpContext.Response.Headers["Cache-Control"] = "no-cache";
            httpContext.Response.Headers["Connection"] = "keep-alive";

            var lastProgress = -1;
            var lastStatus = "";

            try
            {
                while (!ct.IsCancellationRequested)
                {
                    await db.Entry(download).ReloadAsync(ct);

                    if (download.Progress != lastProgress || download.Status.ToString() != lastStatus)
                    {
                        lastProgress = download.Progress;
                        lastStatus = download.Status.ToString();

                        var data = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            id = download.Id,
                            status = download.Status.ToString().ToLowerInvariant(),
                            progress = download.Progress,
                            speed = download.Speed,
                            eta = download.Eta,
                            fragmentIndex = download.FragmentIndex,
                            fragmentCount = download.FragmentCount,
                        });

                        await httpContext.Response.WriteAsync($"event: progress\ndata: {data}\n\n", ct);
                        await httpContext.Response.Body.FlushAsync(ct);
                    }

                    if (download.Status is DownloadStatus.Completed or DownloadStatus.Failed)
                    {
                        var finalData = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            id = download.Id,
                            status = download.Status.ToString().ToLowerInvariant(),
                            progress = download.Progress,
                            error = download.Error,
                        });
                        await httpContext.Response.WriteAsync($"event: complete\ndata: {finalData}\n\n", ct);
                        return;
                    }

                    await Task.Delay(500, ct);
                }
            }
            catch (OperationCanceledException)
            {
                // Client disconnected, this is normal
            }
        });

        // POST /api/internal/downloads - Internal endpoint for webhook (no auth)
        app.MapPost("/api/internal/downloads", async (DownloadRequest request, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(request.Url))
                return Results.BadRequest(new { error = new { code = "INVALID_URL", message = "URL is required" } });

            if (!IsValidYouTubeUrl(request.Url))
                return Results.BadRequest(new { error = new { code = "INVALID_URL", message = "Invalid YouTube URL" } });

            // Assign to first admin
            var admin = await db.Users.FirstOrDefaultAsync(u => u.Role == "admin");
            var adminId = admin?.Id;

            var download = new Download
            {
                Id = Guid.NewGuid().ToString("N")[..12],
                Url = request.Url,
                Status = DownloadStatus.Pending,
                Progress = 0,
                StartedAt = DateTime.UtcNow,
                Quality = request.Quality ?? "1080p",
                ConcurrentFragments = request.ConcurrentFragments ?? 4,
                UserId = adminId
            };

            db.Downloads.Add(download);
            await db.SaveChangesAsync();

            return Results.Created($"/api/downloads/{download.Id}", new { data = download });
        }).AllowAnonymous();
    }

    private static bool IsValidYouTubeUrl(string url)
    {
        var patterns = new[]
        {
            @"^https?://(www\.)?youtube\.com/watch\?v=[\w-]+",
            @"^https?://(www\.)?youtube\.com/shorts/[\w-]+",
            @"^https?://youtu\.be/[\w-]+",
            @"^https?://(www\.)?youtube\.com/live/[\w-]+"
        };

        return patterns.Any(p => System.Text.RegularExpressions.Regex.IsMatch(url, p));
    }
}

public record DownloadRequest(string Url, string? Quality, int? ConcurrentFragments);
