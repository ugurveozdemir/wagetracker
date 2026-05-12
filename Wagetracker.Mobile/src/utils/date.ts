/**
 * Extracts the local date from a Date object as a YYYY-MM-DD string.
 * This prevents the "off-by-one-day" bug that occurs when converting
 * a local midnight time to UTC using toISOString().
 *
 * @param date The Javascript Date object (uses the device's local timezone)
 * @returns A string in the format YYYY-MM-DD representing the local date
 */
export const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
