using Cronos;
using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;

namespace SuperTube.Api.Services;

public class SubscriptionBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SubscriptionBackgroundService> _logger;
    private CronExpression? _cronExpression;
    private string _currentCron = "";

    public SubscriptionBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<SubscriptionBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Subscription background service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await WaitUntilNextRunAsync(stoppingToken);

                if (stoppingToken.IsCancellationRequested)
                    break;

                await CheckSubscriptionsAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in subscription background service");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }

    private async Task WaitUntilNextRunAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Check if subscriptions are enabled
        var enabled = await db.Settings.FindAsync("subscription.enabled");
        if (enabled?.Value != "true")
        {
            _logger.LogDebug("Subscriptions disabled, waiting 5 minutes before rechecking");
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            return;
        }

        // Get cron expression from settings
        var cronSetting = await db.Settings.FindAsync("subscription.cron");
        var cronString = cronSetting?.Value ?? "0 * 9-21 * * *";

        // Update cron expression if changed
        if (cronString != _currentCron)
        {
            try
            {
                _cronExpression = CronExpression.Parse(cronString, CronFormat.IncludeSeconds);
                _currentCron = cronString;
                _logger.LogInformation("Updated cron expression: {Cron}", cronString);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Invalid cron expression: {Cron}, using default", cronString);
                _cronExpression = CronExpression.Parse("0 * 9-21 * * *", CronFormat.IncludeSeconds);
                _currentCron = "0 * 9-21 * * *";
            }
        }

        if (_cronExpression == null)
        {
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            return;
        }

        // Calculate next occurrence
        var now = DateTime.UtcNow;
        var nextOccurrence = _cronExpression.GetNextOccurrence(now, TimeZoneInfo.Local);

        if (nextOccurrence == null)
        {
            _logger.LogWarning("No next occurrence for cron expression");
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            return;
        }

        var delay = nextOccurrence.Value - now;
        if (delay > TimeSpan.Zero)
        {
            _logger.LogDebug("Next subscription check at {NextRun} (in {Delay})", nextOccurrence.Value, delay);
            await Task.Delay(delay, stoppingToken);
        }
    }

    private async Task CheckSubscriptionsAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var subscriptionService = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();

        // Double-check if subscriptions are still enabled
        var enabled = await db.Settings.FindAsync("subscription.enabled");
        if (enabled?.Value != "true")
            return;

        _logger.LogInformation("Starting scheduled subscription check");

        try
        {
            var newVideos = await subscriptionService.CheckAllSubscriptionsAsync(db);
            _logger.LogInformation("Scheduled subscription check completed: {NewVideos} new videos queued", newVideos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during scheduled subscription check");
        }
    }
}
