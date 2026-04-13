using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using WageTracker.API.Models.DTOs;
using WageTracker.API.Models.Entities;

namespace WageTracker.API.Services
{
    public interface IReceiptScanService
    {
        Task<ReceiptScanDraftResponse> ScanAsync(IFormFile receiptImage, CancellationToken cancellationToken = default);
    }

    public class ReceiptScanService : IReceiptScanService
    {
        private static readonly HashSet<string> SupportedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        };

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public ReceiptScanService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<ReceiptScanDraftResponse> ScanAsync(IFormFile receiptImage, CancellationToken cancellationToken = default)
        {
            ValidateReceiptImage(receiptImage);

            var apiKey = _configuration["ReceiptScan:Gemini:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new InvalidOperationException("Receipt scan is not configured.");
            }

            var model = _configuration["ReceiptScan:Model"] ?? "gemini-2.5-flash-lite";
            var timeoutSeconds = GetConfiguredInt("ReceiptScan:TimeoutSeconds", 20);
            var imageBytes = await ReadImageBytesAsync(receiptImage, cancellationToken);
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));

            var request = BuildGeminiRequest(receiptImage.ContentType, Convert.ToBase64String(imageBytes));
            var requestJson = JsonSerializer.Serialize(request, JsonOptions);
            using var content = new StringContent(requestJson, Encoding.UTF8, "application/json");
            using var requestMessage = new HttpRequestMessage(
                HttpMethod.Post,
                $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(model)}:generateContent");
            requestMessage.Headers.Add("x-goog-api-key", apiKey);
            requestMessage.Content = content;
            using var response = await _httpClient.SendAsync(requestMessage, timeoutCts.Token);

            var responseJson = await response.Content.ReadAsStringAsync(timeoutCts.Token);
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException("Receipt scan provider failed.");
            }

            var draftJson = ExtractDraftJson(responseJson);
            var draft = JsonSerializer.Deserialize<GeminiReceiptDraft>(draftJson, JsonOptions)
                ?? throw new InvalidOperationException("Receipt scan provider returned an empty result.");

            return NormalizeDraft(draft);
        }

        private void ValidateReceiptImage(IFormFile receiptImage)
        {
            if (receiptImage == null || receiptImage.Length == 0)
            {
                throw new ArgumentException("Receipt image is required.");
            }

            var maxBytes = GetConfiguredInt("ReceiptScan:MaxImageBytes", 5 * 1024 * 1024);
            if (receiptImage.Length > maxBytes)
            {
                throw new ArgumentException("Receipt image is too large.");
            }

            if (!SupportedContentTypes.Contains(receiptImage.ContentType))
            {
                throw new ArgumentException("Unsupported receipt image type.");
            }
        }

        private int GetConfiguredInt(string key, int fallback)
        {
            return int.TryParse(_configuration[key], out var value) && value > 0 ? value : fallback;
        }

        private static async Task<byte[]> ReadImageBytesAsync(IFormFile receiptImage, CancellationToken cancellationToken)
        {
            await using var stream = receiptImage.OpenReadStream();
            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream, cancellationToken);
            return memoryStream.ToArray();
        }

        private static object BuildGeminiRequest(string mimeType, string base64Image)
        {
            return new
            {
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new object[]
                        {
                            new
                            {
                                text = """
                                You are a receipt extraction engine for an expense tracking app.

                                Extract only information visible in the receipt image. Do not guess missing values.

                                Return a draft expense using this category list:
                                0 = Food & Drinks
                                1 = Transport
                                2 = Shopping
                                3 = Bills & Utilities
                                4 = Entertainment
                                5 = Health
                                6 = Education
                                7 = Other

                                Rules:
                                - amount must be the final paid total, not subtotal, tax, discount, balance due, cash tendered, or change.
                                - If multiple totals exist, choose the final charged amount and add a warning.
                                - date must be the purchase or transaction date in YYYY-MM-DD format.
                                - If the date is missing or unreadable, return null for date.
                                - category must be one of the numeric category IDs above.
                                - description should be short and user-friendly. Prefer merchant name plus useful receipt context.
                                - Do not include line items unless they help explain the description.
                                - If a field is uncertain, return null where allowed and add a warning.
                                - confidence must be between 0 and 1.
                                - Return JSON only.
                                """
                            },
                            new
                            {
                                inline_data = new
                                {
                                    mime_type = mimeType,
                                    data = base64Image
                                }
                            }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0,
                    response_mime_type = "application/json",
                    response_json_schema = new
                    {
                        type = "object",
                        properties = new
                        {
                            amount = new { type = new[] { "number", "null" }, description = "Final paid total from the receipt." },
                            date = new { type = new[] { "string", "null" }, format = "date", description = "Transaction date in YYYY-MM-DD format." },
                            category = new { type = "integer", @enum = new[] { 0, 1, 2, 3, 4, 5, 6, 7 } },
                            description = new { type = new[] { "string", "null" }, description = "Short merchant/context summary for the expense." },
                            confidence = new { type = "number", minimum = 0, maximum = 1 },
                            warnings = new
                            {
                                type = "array",
                                items = new { type = "string" }
                            }
                        },
                        required = new[] { "amount", "date", "category", "description", "confidence", "warnings" }
                    }
                }
            };
        }

        private static string ExtractDraftJson(string responseJson)
        {
            using var document = JsonDocument.Parse(responseJson);
            var root = document.RootElement;
            var candidates = root.GetProperty("candidates");
            if (candidates.GetArrayLength() == 0)
            {
                throw new InvalidOperationException("Receipt scan provider returned no candidates.");
            }

            var parts = candidates[0].GetProperty("content").GetProperty("parts");
            if (parts.GetArrayLength() == 0 || !parts[0].TryGetProperty("text", out var textNode))
            {
                throw new InvalidOperationException("Receipt scan provider returned no text.");
            }

            var text = textNode.GetString();
            if (string.IsNullOrWhiteSpace(text))
            {
                throw new InvalidOperationException("Receipt scan provider returned an empty result.");
            }

            return StripJsonFence(text.Trim());
        }

        private static string StripJsonFence(string text)
        {
            if (!text.StartsWith("```", StringComparison.Ordinal))
            {
                return text;
            }

            var firstNewLine = text.IndexOf('\n');
            var lastFence = text.LastIndexOf("```", StringComparison.Ordinal);
            if (firstNewLine < 0 || lastFence <= firstNewLine)
            {
                return text;
            }

            return text[(firstNewLine + 1)..lastFence].Trim();
        }

        private static ReceiptScanDraftResponse NormalizeDraft(GeminiReceiptDraft draft)
        {
            var warnings = draft.Warnings?
                .Where(warning => !string.IsNullOrWhiteSpace(warning))
                .Select(warning => warning.Trim())
                .Distinct()
                .ToList() ?? new List<string>();

            var normalized = new ReceiptScanDraftResponse
            {
                Amount = draft.Amount is > 0 ? Math.Round(draft.Amount.Value, 2) : null,
                Date = ParseDate(draft.Date, warnings),
                Category = Enum.IsDefined(typeof(ExpenseCategory), draft.Category) ? draft.Category : 7,
                Description = string.IsNullOrWhiteSpace(draft.Description)
                    ? null
                    : draft.Description.Trim()[..Math.Min(draft.Description.Trim().Length, 250)],
                Confidence = Math.Clamp(draft.Confidence, 0, 1),
                Warnings = warnings
            };

            if (normalized.Amount == null)
            {
                normalized.Warnings.Add("Amount could not be read confidently.");
            }

            return normalized;
        }

        private static DateTime? ParseDate(string? value, List<string> warnings)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            if (DateTime.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            {
                return DateTime.SpecifyKind(parsed.Date, DateTimeKind.Utc);
            }

            warnings.Add("Date could not be read confidently.");
            return null;
        }

        private sealed class GeminiReceiptDraft
        {
            public decimal? Amount { get; set; }
            public string? Date { get; set; }
            public int Category { get; set; } = 7;
            public string? Description { get; set; }
            public decimal Confidence { get; set; }
            public List<string>? Warnings { get; set; }
        }
    }
}
