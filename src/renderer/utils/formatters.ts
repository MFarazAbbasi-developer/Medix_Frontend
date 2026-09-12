/**
 * Medix Standard Formatting Utilities
 * Handles consistent currency (PKR/Rs.), quantity, date, and date-time formatting across all routes.
 */

export interface CurrencyFormatOptions {
  /**
   * Prefix style to use.
   * 'PKR' -> 'PKR 1,250.00'
   * 'Rs.' -> 'Rs. 1,250.00'
   * 'none' -> '1,250.00'
   * @default 'PKR'
   */
  prefix?: 'PKR' | 'Rs.' | 'none';
  /**
   * Number of decimal places.
   * @default 2
   */
  decimals?: number;
  /**
   * Fallback string for null/undefined/NaN values.
   * @default '0.00'
   */
  fallback?: string;
  /**
   * Show absolute value without sign.
   * @default false
   */
  absolute?: boolean;
}

/**
 * Formats a monetary amount in PKR with comma grouping and configurable prefix.
 */
export function formatPKR(
  value: number | string | null | undefined,
  options: CurrencyFormatOptions = {},
): string {
  const {
    prefix = 'PKR',
    decimals = 2,
    fallback = '0.00',
    absolute = false,
  } = options;

  if (value === null || value === undefined || value === '') {
    return prefix === 'none' ? fallback : `${prefix} ${fallback}`;
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) {
    return prefix === 'none' ? fallback : `${prefix} ${fallback}`;
  }

  const targetNum = absolute ? Math.abs(num) : num;
  const isNegative = targetNum < 0;
  const absValue = Math.abs(targetNum);

  const formattedNumber = absValue.toLocaleString('en-PK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (prefix === 'none') {
    return isNegative ? `-${formattedNumber}` : formattedNumber;
  }

  return isNegative
    ? `-${prefix} ${formattedNumber}`
    : `${prefix} ${formattedNumber}`;
}

/**
 * Formats a monetary amount (alias for formatPKR with Rs. as default prefix option).
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: CurrencyFormatOptions = {},
): string {
  return formatPKR(value, { prefix: 'Rs.', ...options });
}

export interface QuantityFormatOptions {
  /**
   * Maximum decimal places.
   * @default 2
   */
  maxDecimals?: number;
  /**
   * Minimum decimal places.
   * @default 0
   */
  minDecimals?: number;
  /**
   * Fallback for null/undefined/invalid values.
   * @default '0'
   */
  fallback?: string;
}

/**
 * Formats a stock / transaction quantity with clean integer/decimal representation and optional unit.
 */
export function formatQuantity(
  value: number | string | null | undefined,
  unit?: string,
  options: QuantityFormatOptions = {},
): string {
  const { maxDecimals = 2, minDecimals = 0, fallback = '0' } = options;

  if (value === null || value === undefined || value === '') {
    return unit ? `${fallback} ${unit}` : fallback;
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) {
    return unit ? `${fallback} ${unit}` : fallback;
  }

  const formattedNumber = num.toLocaleString('en-PK', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });

  return unit ? `${formattedNumber} ${unit}` : formattedNumber;
}

export interface DateFormatOptions {
  /**
   * Date format style.
   * 'short' -> '12/09/2026' (DD/MM/YYYY)
   * 'medium' -> '12 Sep 2026'
   * 'long' -> '12 September 2026'
   * 'iso' -> '2026-09-12'
   * @default 'short'
   */
  style?: 'short' | 'medium' | 'long' | 'iso';
  /**
   * Fallback text when date is invalid or empty.
   * @default '—'
   */
  fallback?: string;
}

/**
 * Formats a Date object, ISO string, or timestamp into a standardized, localized date string.
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  options: DateFormatOptions | DateFormatOptions['style'] = {},
): string {
  const opts: DateFormatOptions =
    typeof options === 'string' ? { style: options } : options;
  const { style = 'short', fallback = '—' } = opts;

  if (!date) return fallback;

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return fallback;

  if (style === 'iso') {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (style === 'medium') {
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  if (style === 'long') {
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  // default 'short': DD/MM/YYYY
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export interface DateTimeFormatOptions {
  /**
   * Include seconds in the time output.
   * @default false
   */
  includeSeconds?: boolean;
  /**
   * Date format style.
   * @default 'short'
   */
  dateStyle?: 'short' | 'medium';
  /**
   * Fallback text when date is invalid or empty.
   * @default '—'
   */
  fallback?: string;
}

/**
 * Formats a Date object, ISO string, or timestamp into a date and time string.
 * Example: '12/09/2026, 04:30 PM'
 */
export function formatDateTime(
  date: Date | string | number | null | undefined,
  options: DateTimeFormatOptions = {},
): string {
  const { includeSeconds = false, dateStyle = 'short', fallback = '—' } = options;

  if (!date) return fallback;

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return fallback;

  const datePart = formatDate(d, { style: dateStyle });
  const timePart = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}
