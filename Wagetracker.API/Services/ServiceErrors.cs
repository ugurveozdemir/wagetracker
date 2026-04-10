namespace WageTracker.API.Services
{
    public class SubscriptionAccessException : Exception
    {
        public SubscriptionAccessException(string code, string message) : base(message)
        {
            Code = code;
        }

        public string Code { get; }
    }
}
