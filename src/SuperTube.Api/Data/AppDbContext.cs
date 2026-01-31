using Microsoft.EntityFrameworkCore;

namespace SuperTube.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Video> Videos => Set<Video>();
    public DbSet<Download> Downloads => Set<Download>();
    public DbSet<Setting> Settings => Set<Setting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Video>(e =>
        {
            e.HasKey(v => v.Id);
            e.HasIndex(v => v.Uploader);
            e.HasIndex(v => v.DownloadedAt).IsDescending();
        });

        modelBuilder.Entity<Download>(e =>
        {
            e.HasKey(d => d.Id);
            e.HasIndex(d => d.Status);
        });

        modelBuilder.Entity<Setting>()
            .HasKey(s => s.Key);
    }
}
