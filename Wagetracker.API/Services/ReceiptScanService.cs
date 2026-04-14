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

        private static readonly HashSet<string> AllowedItemTags = new(StringComparer.OrdinalIgnoreCase)
        {
            "groceries",
            "snacks",
            "ready_meal",
            "household",
            "personal_care",
            "clothing",
            "school",
            "medicine",
            "electronics",
            "transport",
            "tax_fee",
            "discount",
            "adjustment",
            "other"
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

                                Return one parent expense and item-level sub-buyings using this category list:
                                0 = Food & Drinks
                                1 = Transport
                                2 = Shopping
                                3 = Bills & Utilities
                                4 = Entertainment
                                5 = Health
                                6 = Education
                                7 = Other

                                Rules:
                                Item tag list:
                                groceries, snacks, ready_meal, household, personal_care, clothing, school, medicine,
                                electronics, transport, tax_fee, discount, adjustment, other

                                Item kind list:
                                Product, Tax, Discount, Fee, Adjustment

                                Rules:
                                - amount must be the final paid total, not subtotal, tax, discount, balance due, cash tendered, change, cashback, or savings.
                                - If multiple totals exist, choose the final charged amount and add a warning.
                                - date must be the purchase or transaction date in YYYY-MM-DD format.
                                - If the date is missing or unreadable, return null for date.
                                - category must be one of the numeric category IDs above.
                                - merchantName should be the store or restaurant name if visible.
                                - description should be short and user-friendly. Prefer merchant name plus useful receipt context.
                                - Extract visible line items. Do not invent products, prices, tax, or discounts.
                                - Preserve abbreviated receipt item names when uncertain; normalize only obvious names.
                                - Product item amounts must be positive.
                                - Tax, fees, deposits, bag fees, bottle deposits, coupons, and discounts should be item rows when visible.
                                - Discount rows should use kind Discount and a negative totalAmount.
                                - Tax/fee rows should use tag tax_fee.
                                - If product/tax/discount rows do not add up to the final total, do not change amount. Add a warning.
                                - If a line item is unreadable, include the visible abbreviation and add a warning.
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
                            merchantName = new { type = new[] { "string", "null" }, description = "Store or merchant name from the receipt." },
                            subtotalAmount = new { type = new[] { "number", "null" } },
                            taxAmount = new { type = new[] { "number", "null" } },
                            discountAmount = new { type = new[] { "number", "null" } },
                            items = new
                            {
                                type = "array",
                                items = new
                                {
                                    type = "object",
                                    properties = new
                                    {
                                        name = new { type = "string" },
                                        totalAmount = new { type = "number" },
                                        quantity = new { type = new[] { "number", "null" } },
                                        unitPrice = new { type = new[] { "number", "null" } },
                                        category = new { type = "integer", @enum = new[] { 0, 1, 2, 3, 4, 5, 6, 7 } },
                                        tag = new { type = "string", @enum = AllowedItemTags.ToArray() },
                                        kind = new { type = "string", @enum = new[] { "Product", "Tax", "Discount", "Fee", "Adjustment" } },
                                        confidence = new { type = new[] { "number", "null" }, minimum = 0, maximum = 1 }
                                    },
                                    required = new[] { "name", "totalAmount", "quantity", "unitPrice", "category", "tag", "kind", "confidence" }
                                }
                            },
                            confidence = new { type = "number", minimum = 0, maximum = 1 },
                            warnings = new
                            {
                                type = "array",
                                items = new { type = "string" }
                            }
                        },
                        required = new[] { "amount", "date", "category", "description", "merchantName", "subtotalAmount", "taxAmount", "discountAmount", "items", "confidence", "warnings" }
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
                MerchantName = TrimToNull(draft.MerchantName, 160),
                SubtotalAmount = NormalizePositiveAmount(draft.SubtotalAmount),
                TaxAmount = NormalizePositiveAmount(draft.TaxAmount),
                DiscountAmount = NormalizePositiveAmount(draft.DiscountAmount),
                Confidence = Math.Clamp(draft.Confidence, 0, 1),
                Warnings = warnings,
                Items = NormalizeItems(draft.Items, warnings)
            };

            if (normalized.Amount == null)
            {
                normalized.Warnings.Add("Amount could not be read confidently.");
            }

            normalized.ItemTotalAmount = Math.Round(normalized.Items.Sum(item => item.TotalAmount), 2);
            if (normalized.Amount.HasValue && normalized.Items.Count > 0)
            {
                var difference = Math.Round(normalized.Amount.Value - normalized.ItemTotalAmount, 2);
                normalized.ReconciliationDifference = difference == 0 ? null : difference;
                if (Math.Abs(difference) > 0.01m)
                {
                    normalized.Items.Add(new ReceiptScanItemDraft
                    {
                        Name = "Receipt adjustment",
                        TotalAmount = difference,
                        Category = 7,
                        Tag = "adjustment",
                        Kind = "Adjustment",
                        Confidence = normalized.Confidence
                    });
                    normalized.ItemTotalAmount = Math.Round(normalized.Items.Sum(item => item.TotalAmount), 2);
                    normalized.Warnings.Add("Item totals did not match the final receipt total, so an adjustment row was added.");
                }
            }

            if (normalized.Items.Count == 0)
            {
                normalized.Warnings.Add("No item-level rows could be read confidently.");
            }

            return normalized;
        }

        private static decimal? NormalizePositiveAmount(decimal? value)
        {
            return value.HasValue && value.Value >= 0 ? Math.Round(value.Value, 2) : null;
        }

        private static string? TrimToNull(string? value, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var trimmed = value.Trim();
            return trimmed[..Math.Min(trimmed.Length, maxLength)];
        }

        private static List<ReceiptScanItemDraft> NormalizeItems(List<GeminiReceiptItemDraft>? items, List<string> warnings)
        {
            if (items == null)
            {
                return new List<ReceiptScanItemDraft>();
            }

            var normalized = new List<ReceiptScanItemDraft>();
            foreach (var item in items)
            {
                var name = TrimToNull(item.Name, 160);
                if (name == null || item.TotalAmount == 0)
                {
                    continue;
                }

                var kind = NormalizeKind(item.Kind);
                var totalAmount = Math.Round(item.TotalAmount, 2);
                if (kind != "Discount" && totalAmount < 0)
                {
                    kind = "Discount";
                    warnings.Add($"Negative item amount treated as a discount: {name}.");
                }

                if (kind == "Product" && totalAmount <= 0)
                {
                    continue;
                }

                normalized.Add(new ReceiptScanItemDraft
                {
                    Name = name,
                    TotalAmount = totalAmount,
                    Quantity = item.Quantity.HasValue && item.Quantity.Value > 0 ? Math.Round(item.Quantity.Value, 3) : null,
                    UnitPrice = item.UnitPrice.HasValue && item.UnitPrice.Value >= 0 ? Math.Round(item.UnitPrice.Value, 2) : null,
                    Category = Enum.IsDefined(typeof(ExpenseCategory), item.Category) ? item.Category : 7,
                    Tag = NormalizeTag(item.Tag, kind),
                    Kind = kind,
                    Confidence = item.Confidence.HasValue ? Math.Clamp(item.Confidence.Value, 0, 1) : null
                });
            }

            return normalized;
        }

        private static string NormalizeKind(string? value)
        {
            return value?.Trim().ToLowerInvariant() switch
            {
                "tax" => "Tax",
                "discount" => "Discount",
                "fee" => "Fee",
                "adjustment" => "Adjustment",
                _ => "Product"
            };
        }

        private static string NormalizeTag(string? value, string kind)
        {
            if (!string.IsNullOrWhiteSpace(value) && AllowedItemTags.Contains(value.Trim()))
            {
                return value.Trim().ToLowerInvariant();
            }

            return kind switch
            {
                "Tax" or "Fee" => "tax_fee",
                "Discount" => "discount",
                "Adjustment" => "adjustment",
                _ => "other"
            };
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
            public string? MerchantName { get; set; }
            public decimal? SubtotalAmount { get; set; }
            public decimal? TaxAmount { get; set; }
            public decimal? DiscountAmount { get; set; }
            public List<GeminiReceiptItemDraft>? Items { get; set; }
            public decimal Confidence { get; set; }
            public List<string>? Warnings { get; set; }
        }

        private sealed class GeminiReceiptItemDraft
        {
            public string? Name { get; set; }
            public decimal TotalAmount { get; set; }
            public decimal? Quantity { get; set; }
            public decimal? UnitPrice { get; set; }
            public int Category { get; set; } = 7;
            public string? Tag { get; set; }
            public string? Kind { get; set; }
            public decimal? Confidence { get; set; }
        }
    }
}
