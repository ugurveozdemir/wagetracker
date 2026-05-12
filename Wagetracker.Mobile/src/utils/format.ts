/**
 * Shared formatting utilities.
 *
 * Centralises formatCurrency so all screens produce consistent output
 * and locale/precision changes only need to be made in one place.
 */

/**
 * Formats a number as a USD currency string.
 * Always shows 2 decimal places: $1,234.56
 *
 * Pass `undefined` or `null` to get '$0.00'.
 */
export const formatCurrency = (amount: number | undefined | null): string => {
    const value = amount ?? 0;
    return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

/**
 * Formats a number as a compact USD string without cents: $1,234
 * Useful for chart labels or tight spaces.
 */
export const formatCurrencyCompact = (amount: number | undefined | null): string => {
    const value = amount ?? 0;
    return `$${Math.round(value).toLocaleString('en-US')}`;
};
