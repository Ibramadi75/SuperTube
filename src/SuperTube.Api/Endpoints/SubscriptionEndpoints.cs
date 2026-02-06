using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;
using SuperTube.Api.Services;

namespace SuperTube.Api.Endpoints;

public static class SubscriptionEndpoints
{
    public static void MapSubscriptionEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/subscriptions").RequireAuthorization();

        // GET /api/subscriptions - List all subscriptions
        group.MapGet("/", async (AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId();
            var subscriptions = await db.Subscriptions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.SubscribedAt)
                .ToListAsync();

            return Results.Ok(new { data = subscriptions, total = subscriptions.Count });
        });

        // GET /api/subscriptions/{id} - Get subscription by ID
        group.MapGet("/{id}", async (string id, AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId();
            var subscription = await db.Subscriptions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            return subscription is not null
                ? Results.Ok(new { data = subscription })
                : Results.NotFound(new { error = new { code = "SUBSCRIPTION_NOT_FOUND", message = $"Subscription '{id}' not found" } });
        });

        // POST /api/subscriptions - Create subscription from channel URL
        group.MapPost("/", async (CreateSubscriptionRequest request, AppDbContext db, HttpContext httpContext, ISubscriptionService subscriptionService) =>
        {
            if (string.IsNullOrWhiteSpace(request.ChannelUrl))
                return Results.BadRequest(new { error = new { code = "INVALID_URL", message = "Channel URL is required" } });

            var userId = httpContext.GetUserId()!;
            var subscription = await subscriptionService.CreateFromUrlAsync(request.ChannelUrl, db, userId);
            if (subscription is null)
                return Results.BadRequest(new { error = new { code = "CREATE_FAILED", message = "Failed to create subscription. Could not fetch channel info." } });

            return Results.Created($"/api/subscriptions/{subscription.Id}", new { data = subscription });
        });

        // PUT /api/subscriptions/{id} - Update subscription (toggle active)
        group.MapPut("/{id}", async (string id, UpdateSubscriptionRequest request, AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId();
            var subscription = await db.Subscriptions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (subscription is null)
                return Results.NotFound(new { error = new { code = "SUBSCRIPTION_NOT_FOUND", message = $"Subscription '{id}' not found" } });

            if (request.IsActive.HasValue)
                subscription.IsActive = request.IsActive.Value;

            await db.SaveChangesAsync();

            return Results.Ok(new { data = subscription });
        });

        // DELETE /api/subscriptions/{id} - Delete subscription
        group.MapDelete("/{id}", async (string id, AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId();
            var subscription = await db.Subscriptions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (subscription is null)
                return Results.NotFound(new { error = new { code = "SUBSCRIPTION_NOT_FOUND", message = $"Subscription '{id}' not found" } });

            db.Subscriptions.Remove(subscription);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });

        // POST /api/subscriptions/{id}/check - Check subscription for new videos
        group.MapPost("/{id}/check", async (string id, AppDbContext db, HttpContext httpContext, ISubscriptionService subscriptionService) =>
        {
            var userId = httpContext.GetUserId();
            var subscription = await db.Subscriptions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (subscription is null)
                return Results.NotFound(new { error = new { code = "SUBSCRIPTION_NOT_FOUND", message = $"Subscription '{id}' not found" } });

            var newVideos = await subscriptionService.CheckSubscriptionAsync(id, db);

            return Results.Ok(new { data = new { newVideos, lastCheckedAt = subscription.LastCheckedAt } });
        });

        // POST /api/subscriptions/check-all - Check all subscriptions
        group.MapPost("/check-all", async (AppDbContext db, HttpContext httpContext, ISubscriptionService subscriptionService) =>
        {
            var userId = httpContext.GetUserId();
            var newVideos = await subscriptionService.CheckAllSubscriptionsAsync(db, userId);
            var activeCount = await db.Subscriptions.CountAsync(s => s.IsActive && s.UserId == userId);

            return Results.Ok(new { data = new { newVideos, checkedSubscriptions = activeCount } });
        });
    }
}

public record CreateSubscriptionRequest(string? ChannelUrl);
public record UpdateSubscriptionRequest(bool? IsActive);
