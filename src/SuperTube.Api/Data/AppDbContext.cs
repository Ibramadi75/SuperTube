using Microsoft.EntityFrameworkCore;

namespace SuperTube.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Video> Videos => Set<Video>();
    public DbSet<Download> Downloads => Set<Download>();
    public DbSet<Setting> Settings => Set<Setting>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserSetting> UserSettings => Set<UserSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Video>(e =>
        {
            e.HasKey(v => v.Id);
            e.HasIndex(v => v.Uploader);
            e.HasIndex(v => v.DownloadedAt).IsDescending();
            e.HasIndex(v => v.PublishedAt).IsDescending();
            e.HasIndex(v => v.ChannelId);
            e.HasIndex(v => v.UserId);
        });

        modelBuilder.Entity<Download>(e =>
        {
            e.HasKey(d => d.Id);
            e.HasIndex(d => d.Status);
            e.HasIndex(d => d.UserId);
        });

        modelBuilder.Entity<Setting>()
            .HasKey(s => s.Key);

        modelBuilder.Entity<Subscription>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.ChannelId).IsUnique();
            e.HasIndex(s => s.IsActive);
            e.HasIndex(s => s.UserId);
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Username).IsUnique();
        });

        modelBuilder.Entity<UserSetting>(e =>
        {
            e.HasKey(us => new { us.Key, us.UserId });
        });
    }
}
