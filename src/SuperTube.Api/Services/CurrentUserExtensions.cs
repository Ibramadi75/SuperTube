using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;

namespace SuperTube.Api.Services;

public static class CurrentUserExtensions
{
    public static string? GetUserId(this HttpContext context)
    {
        return context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    public static bool IsAdmin(this HttpContext context)
    {
        return context.User.IsInRole("admin");
    }

    public static async Task<long> GetUserStorageUsedBytes(AppDbContext db, string userId)
    {
        return await db.Videos
            .Where(v => v.UserId == userId)
            .SumAsync(v => v.Filesize ?? 0);
    }
}
