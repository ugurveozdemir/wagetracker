namespace WageTracker.API.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetCodeAsync(string toEmail, string resetCode, CancellationToken cancellationToken = default);
    }
}
