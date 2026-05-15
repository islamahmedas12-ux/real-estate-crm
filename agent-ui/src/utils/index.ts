import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const _currencyFormatters = new Map<string, Intl.NumberFormat>();
const _dateFormatters = new Map<string, Intl.DateTimeFormat>();
const _numberFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, currency = 'SAR', locale?: string): string {
  const lc = locale ?? 'en-US';
  const key = `${lc}|${currency}`;
  if (!_currencyFormatters.has(key)) {
    _currencyFormatters.set(key, new Intl.NumberFormat(lc, { style: 'currency', currency }));
  }
  return _currencyFormatters.get(key)!.format(amount);
}

export function formatDate(date: string | Date, locale?: string): string {
  const lc = locale ?? 'en-US';
  if (!_dateFormatters.has(lc)) {
    _dateFormatters.set(
      lc,
      new Intl.DateTimeFormat(lc, { year: 'numeric', month: 'short', day: 'numeric' }),
    );
  }
  return _dateFormatters.get(lc)!.format(new Date(date));
}

export function formatNumber(num: number, locale?: string): string {
  const lc = locale ?? 'en-US';
  if (!_numberFormatters.has(lc)) {
    _numberFormatters.set(lc, new Intl.NumberFormat(lc));
  }
  return _numberFormatters.get(lc)!.format(num);
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '…';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
