using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;
using SuperTube.Api.Services;

namespace SuperTube.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        // POST /api/auth/login - Login
        group.MapPost("/login", async (LoginRequest request, AppDbContext db, AuthService authService) =>
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest(new { error = new { code = "INVALID_REQUEST", message = "Username and password are required" } });

            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user is null || !authService.VerifyPassword(request.Password, user.PasswordHash))
                return Results.Unauthorized();

            if (user.JwtSecret is null)
            {
                user.JwtSecret = AuthService.GenerateSecret();
                await db.SaveChangesAsync();
            }

            var token = authService.GenerateToken(user);

            return Results.Ok(new
            {
                data = new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        username = user.Username,
                        displayName = user.DisplayName,
                        role = user.Role,
                        storageQuotaBytes = user.StorageQuotaBytes
                    }
                }
            });
        }).AllowAnonymous();

        // GET /api/auth/me - Get current user info
        group.MapGet("/me", async (HttpContext httpContext, AppDbContext db) =>
        {
            var userId = httpContext.GetUserId();
            if (userId is null)
                return Results.Unauthorized();

            var user = await db.Users.FindAsync(userId);
            if (user is null)
                return Results.Unauthorized();

            var storageUsed = await CurrentUserExtensions.GetUserStorageUsedBytes(db, userId);

            return Results.Ok(new
            {
                data = new
                {
                    id = user.Id,
                    username = user.Username,
                    displayName = user.DisplayName,
                    role = user.Role,
                    storageQuotaBytes = user.StorageQuotaBytes,
                    storageUsedBytes = storageUsed
                }
            });
        }).RequireAuthorization();

        // POST /api/auth/users - Create user (admin only)
        group.MapPost("/users", async (CreateUserRequest request, HttpContext httpContext, AppDbContext db, AuthService authService) =>
        {
            if (!httpContext.IsAdmin())
                return Results.Forbid();

            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest(new { error = new { code = "INVALID_REQUEST", message = "Username and password are required" } });

            if (request.Username.Length < 3)
                return Results.BadRequest(new { error = new { code = "INVALID_REQUEST", message = "Username must be at least 3 characters" } });

            if (request.Password.Length < 4)
                return Results.BadRequest(new { error = new { code = "INVALID_REQUEST", message = "Password must be at least 4 characters" } });

            var existing = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (existing is not null)
                return Results.Conflict(new { error = new { code = "USERNAME_EXISTS", message = "Username already taken" } });

            var user = new User
            {
                Id = Guid.NewGuid().ToString("N")[..12],
                Username = request.Username,
                PasswordHash = authService.HashPassword(request.Password),
                DisplayName = request.DisplayName ?? request.Username,
                Role = request.Role ?? "user",
                CreatedAt = DateTime.UtcNow,
                StorageQuotaBytes = request.StorageQuotaBytes,
                JwtSecret = AuthService.GenerateSecret()
            };

            db.Users.Add(user);

            // Copy global default settings to UserSettings for the new user
            var settings = await db.Settings.ToListAsync();
            foreach (var setting in settings)
            {
                db.UserSettings.Add(new UserSetting
                {
                    Key = setting.Key,
                    UserId = user.Id,
                    Value = setting.Value
                });
            }

            await db.SaveChangesAsync();

            return Results.Created($"/api/auth/users/{user.Id}", new
            {
                data = new
                {
                    id = user.Id,
                    username = user.Username,
                    displayName = user.DisplayName,
                    role = user.Role,
                    storageQuotaBytes = user.StorageQuotaBytes
                }
            });
        }).RequireAuthorization();

        // GET /api/auth/users - List users (admin only)
        group.MapGet("/users", async (HttpContext httpContext, AppDbContext db) =>
        {
            if (!httpContext.IsAdmin())
                return Results.Forbid();

            var users = await db.Users
                .OrderBy(u => u.CreatedAt)
                .ToListAsync();

            var usersWithStorage = new List<object>();
            foreach (var user in users)
            {
                var storageUsed = await CurrentUserExtensions.GetUserStorageUsedBytes(db, user.Id);
                usersWithStorage.Add(new
                {
                    id = user.Id,
                    username = user.Username,
                    displayName = user.DisplayName,
                    role = user.Role,
                    createdAt = user.CreatedAt,
                    storageQuotaBytes = user.StorageQuotaBytes,
                    storageUsedBytes = storageUsed
                });
            }

            return Results.Ok(new { data = usersWithStorage });
        }).RequireAuthorization();

        // PUT /api/auth/users/{id} - Update user (admin only)
        group.MapPut("/users/{id}", async (string id, UpdateUserRequest request, HttpContext httpContext, AppDbContext db) =>
        {
            if (!httpContext.IsAdmin())
                return Results.Forbid();

            var user = await db.Users.FindAsync(id);
            if (user is null)
                return Results.NotFound(new { error = new { code = "USER_NOT_FOUND", message = $"User '{id}' not found" } });

            if (request.DisplayName is not null)
                user.DisplayName = request.DisplayName;
            if (request.Role is not null)
                user.Role = request.Role;
            if (request.StorageQuotaBytes.HasValue)
                user.StorageQuotaBytes = request.StorageQuotaBytes.Value == 0 ? null : request.StorageQuotaBytes.Value;

            await db.SaveChangesAsync();

            var storageUsed = await CurrentUserExtensions.GetUserStorageUsedBytes(db, user.Id);

            return Results.Ok(new
            {
                data = new
                {
                    id = user.Id,
                    username = user.Username,
                    displayName = user.DisplayName,
                    role = user.Role,
                    storageQuotaBytes = user.StorageQuotaBytes,
                    storageUsedBytes = storageUsed
                }
            });
        }).RequireAuthorization();

        // DELETE /api/auth/users/{id} - Delete user (admin only)
        group.MapDelete("/users/{id}", async (string id, HttpContext httpContext, AppDbContext db) =>
        {
            if (!httpContext.IsAdmin())
                return Results.Forbid();

            var currentUserId = httpContext.GetUserId();
            if (id == currentUserId)
                return Results.BadRequest(new { error = new { code = "CANNOT_DELETE_SELF", message = "Cannot delete your own account" } });

            var user = await db.Users.FindAsync(id);
            if (user is null)
                return Results.NotFound(new { error = new { code = "USER_NOT_FOUND", message = $"User '{id}' not found" } });

            // Delete user's videos from disk
            var videos = await db.Videos.Where(v => v.UserId == id).ToListAsync();
            foreach (var video in videos)
            {
                if (File.Exists(video.Filepath))
                    File.Delete(video.Filepath);
                if (video.ThumbnailPath is not null && File.Exists(video.ThumbnailPath))
                    File.Delete(video.ThumbnailPath);
            }

            // Delete user's data
            db.Videos.RemoveRange(videos);
            db.Downloads.RemoveRange(db.Downloads.Where(d => d.UserId == id));
            db.Subscriptions.RemoveRange(db.Subscriptions.Where(s => s.UserId == id));
            db.UserSettings.RemoveRange(db.UserSettings.Where(us => us.UserId == id));
            db.Users.Remove(user);

            await db.SaveChangesAsync();

            return Results.NoContent();
        }).RequireAuthorization();

        // GET /api/auth/token - Get a fresh token for the current user
        group.MapGet("/token", async (HttpContext httpContext, AppDbContext db, AuthService authService) =>
        {
            var userId = httpContext.GetUserId();
            if (userId is null)
                return Results.Unauthorized();

            var user = await db.Users.FindAsync(userId);
            if (user is null)
                return Results.Unauthorized();

            if (user.JwtSecret is null)
            {
                user.JwtSecret = AuthService.GenerateSecret();
                await db.SaveChangesAsync();
            }

            var token = authService.GenerateToken(user);
            return Results.Ok(new { data = new { token } });
        }).RequireAuthorization();

        // POST /api/auth/token/reset - Regenerate JWT secret and return new token
        group.MapPost("/token/reset", async (HttpContext httpContext, AppDbContext db, AuthService authService) =>
        {
            var userId = httpContext.GetUserId();
            if (userId is null)
                return Results.Unauthorized();

            var user = await db.Users.FindAsync(userId);
            if (user is null)
                return Results.Unauthorized();

            user.JwtSecret = AuthService.GenerateSecret();
            await db.SaveChangesAsync();

            var token = authService.GenerateToken(user);
            return Results.Ok(new { data = new { token } });
        }).RequireAuthorization();

        // PUT /api/auth/password - Change own password
        group.MapPut("/password", async (ChangePasswordRequest request, HttpContext httpContext, AppDbContext db, AuthService authService) =>
        {
            var userId = httpContext.GetUserId();
            if (userId is null)
                return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
                return Results.BadRequest(new { error = new { code = "INVALID_REQUEST", message = "Current and new password are required" } });

            if (request.NewPassword.Length < 4)
                return Results.BadRequest(new { error = new { code = "INVALID_REQUEST", message = "New password must be at least 4 characters" } });

            var user = await db.Users.FindAsync(userId);
            if (user is null)
                return Results.Unauthorized();

            if (!authService.VerifyPassword(request.CurrentPassword, user.PasswordHash))
                return Results.BadRequest(new { error = new { code = "WRONG_PASSWORD", message = "Current password is incorrect" } });

            user.PasswordHash = authService.HashPassword(request.NewPassword);
            await db.SaveChangesAsync();

            return Results.Ok(new { data = new { message = "Password updated" } });
        }).RequireAuthorization();
    }
}

public record LoginRequest(string Username, string Password);
public record CreateUserRequest(string Username, string Password, string? DisplayName, string? Role, long? StorageQuotaBytes);
public record UpdateUserRequest(string? DisplayName, string? Role, long? StorageQuotaBytes);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
