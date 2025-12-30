/**
 * Date utility functions to handle timezone-safe date parsing
 *
 * Problem: When parsing date strings like "2025-11-13" with new Date(),
 * JavaScript treats it as UTC midnight (00:00:00 UTC). When displaying
 * in local timezone, this causes date shifting issues.
 *
 * For example in Hawaii (UTC-10):
 * - new Date("2025-11-13") → 2025-11-13 00:00:00 UTC
 * - Displayed in HST → 2025-11-12 14:00:00 HST (1 day earlier!)
 *
 * Solution: Parse date strings manually in local timezone to avoid UTC conversion
 */

/**
 * Parse a date string (YYYY-MM-DD) in local timezone
 * @param dateString - Date string in format YYYY-MM-DD
 * @returns Date object in local timezone
 */
export function parseDateInLocalTimezone(dateString: string): Date {
  // Input format: 'YYYY-MM-DD'
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date in local timezone (month is 0-indexed)
  return new Date(year, month - 1, day);
}

/**
 * Parse a datetime string (YYYY-MM-DDTHH:MM) in local timezone
 * @param dateString - Date string in format YYYY-MM-DD
 * @param timeString - Time string in format HH:MM
 * @returns Date object in local timezone
 */
export function parseDateTimeInLocalTimezone(dateString: string, timeString: string = '00:00'): Date {
  // Input format: 'YYYY-MM-DD' and 'HH:MM'
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  // Create datetime in local timezone (month is 0-indexed)
  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Format a date string (YYYY-MM-DD) for display
 * Safely parses the date in local timezone before formatting
 * @param dateString - Date string in format YYYY-MM-DD
 * @param formatFn - Function to format the date (e.g., from date-fns)
 * @returns Formatted date string
 */
export function formatDateSafe(dateString: string, formatFn: (date: Date, format: string) => string, format: string): string {
  const date = parseDateInLocalTimezone(dateString);
  return formatFn(date, format);
}

/**
 * Calculate difference between two dates in days (inclusive)
 * @param startDateString - Start date in format YYYY-MM-DD
 * @param endDateString - End date in format YYYY-MM-DD
 * @returns Number of days between the dates (inclusive)
 */
export function calculateDaysBetween(startDateString: string, endDateString: string): number {
  const start = parseDateInLocalTimezone(startDateString);
  const end = parseDateInLocalTimezone(endDateString);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if a date is before another date (both in YYYY-MM-DD format)
 * @param date1String - First date in format YYYY-MM-DD
 * @param date2String - Second date in format YYYY-MM-DD
 * @returns true if date1 is before date2
 */
export function isDateBefore(date1String: string, date2String: string): boolean {
  const date1 = parseDateInLocalTimezone(date1String);
  const date2 = parseDateInLocalTimezone(date2String);
  return date1 < date2;
}

/**
 * Check if a date is today
 * @param dateString - Date in format YYYY-MM-DD
 * @returns true if the date is today
 */
export function isToday(dateString: string): boolean {
  const date = parseDateInLocalTimezone(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Add days to a date string
 * @param dateString - Date in format YYYY-MM-DD
 * @param days - Number of days to add
 * @returns New date string in format YYYY-MM-DD
 */
export function addDays(dateString: string, days: number): string {
  const date = parseDateInLocalTimezone(dateString);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================
// Time Formatting Utilities (12-hour AM/PM format)
// ============================================

/**
 * Convert 24-hour time string to 12-hour AM/PM format
 * @param time24 - Time string in format HH:MM (e.g., "14:00")
 * @returns Formatted time string (e.g., "2:00 PM")
 */
export function formatTimeToAMPM(time24: string): string {
  if (!time24) return '';

  const [hourStr, minuteStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr || '00';

  if (isNaN(hour)) return time24;

  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${hour12}:${minute} ${period}`;
}

/**
 * Hour option type for time selection dropdowns
 */
export interface TimeOption {
  value: string;  // 24-hour format for backend (e.g., "14:00")
  label: string;  // 12-hour format for display (e.g., "2:00 PM")
}

/**
 * Generate hour options for time selection dropdowns
 * Values are in 24-hour format (for backend), labels in 12-hour AM/PM format (for display)
 * @returns Array of time options from 00:00 to 23:00
 */
export function generateHourOptions(): TimeOption[] {
  return Array.from({ length: 24 }, (_, i) => {
    const value = `${i.toString().padStart(2, '0')}:00`;
    return {
      value,
      label: formatTimeToAMPM(value),
    };
  });
}

/**
 * Pre-generated hour options constant for optimal performance
 * Use this instead of calling generateHourOptions() in components
 */
export const HOUR_OPTIONS: TimeOption[] = generateHourOptions();
