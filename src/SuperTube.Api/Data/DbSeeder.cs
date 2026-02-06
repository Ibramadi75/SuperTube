using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Services;

namespace SuperTube.Api.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        SeedSettings(db);
        SeedAdminUser(db);
        db.SaveChanges();
    }

    private static void SeedSettings(AppDbContext db)
    {
        var defaultSettings = new Dictionary<string, string>
        {
            ["quality.default"] = "1080p",
            ["format.video"] = "mp4",
            ["format.audio"] = "mp3",
            ["format.thumbnail"] = "true",
            ["format.embedThumbnail"] = "true",
            ["performance.concurrentFragments"] = "4",
            ["performance.rateLimit"] = "0",
            ["performance.retries"] = "3",
            ["sponsorblock.enabled"] = "true",
            ["sponsorblock.action"] = "mark",
            ["sponsorblock.categories"] = "sponsor,intro,outro,selfpromo,preview,filler,interaction",
            ["subscription.enabled"] = "true",
            ["subscription.auto_subscribe"] = "true",
            ["subscription.cron"] = "0 * 9-21 * * *"
        };

        var existingKeys = db.Settings.Select(s => s.Key).ToHashSet();

        foreach (var (key, value) in defaultSettings)
        {
            if (!existingKeys.Contains(key))
            {
                db.Settings.Add(new Setting { Key = key, Value = value });
            }
        }
    }

    private static void SeedAdminUser(AppDbContext db)
    {
        if (db.Users.Any())
            return;

        var username = Environment.GetEnvironmentVariable("ADMIN_USERNAME") ?? "admin";
        var password = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "admin";

        var admin = new User
        {
            Id = Guid.NewGuid().ToString("N")[..12],
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 11),
            DisplayName = "Admin",
            Role = "admin",
            CreatedAt = DateTime.UtcNow,
            StorageQuotaBytes = null,
            JwtSecret = AuthService.GenerateSecret()
        };

        db.Users.Add(admin);
        db.SaveChanges();

        // Assign orphaned data to the admin
        db.Database.ExecuteSqlRaw("UPDATE Videos SET UserId = {0} WHERE UserId IS NULL", admin.Id);
        db.Database.ExecuteSqlRaw("UPDATE Downloads SET UserId = {0} WHERE UserId IS NULL", admin.Id);
        db.Database.ExecuteSqlRaw("UPDATE Subscriptions SET UserId = {0} WHERE UserId IS NULL", admin.Id);

        // Copy global Settings to UserSettings for the admin
        var settings = db.Settings.ToList();
        foreach (var setting in settings)
        {
            var exists = db.UserSettings.Any(us => us.Key == setting.Key && us.UserId == admin.Id);
            if (!exists)
            {
                db.UserSettings.Add(new UserSetting
                {
                    Key = setting.Key,
                    UserId = admin.Id,
                    Value = setting.Value
                });
            }
        }
    }

}
