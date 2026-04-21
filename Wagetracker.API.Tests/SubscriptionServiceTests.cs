using WageTracker.API.Services;

namespace Wagetracker.API.Tests;

public class SubscriptionServiceTests
{
    [Theory]
    [InlineData("rc-secret", "rc-secret", null)]
    [InlineData("rc-secret", "Bearer rc-secret", null)]
    [InlineData("Bearer rc-secret", "Bearer rc-secret", null)]
    [InlineData("rc-secret", "  Bearer rc-secret  ", null)]
    [InlineData("rc-secret", null, "rc-secret")]
    public void IsWebhookAuthorizationValid_AcceptsConfiguredRevenueCatHeaderFormats(
        string expectedSecret,
        string? authorizationHeader,
        string? xAuthorizationHeader)
    {
        var isValid = SubscriptionService.IsWebhookAuthorizationValid(
            expectedSecret,
            authorizationHeader,
            xAuthorizationHeader);

        Assert.True(isValid);
    }

    [Fact]
    public void IsWebhookAuthorizationValid_RejectsMismatchedHeaders()
    {
        var isValid = SubscriptionService.IsWebhookAuthorizationValid(
            "rc-secret",
            "wrong-secret",
            null);

        Assert.False(isValid);
    }
}
