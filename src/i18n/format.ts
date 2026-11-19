import { INTL_TAGS, type Locale } from "./config";

export function formatCurrency(locale: Locale, value: number): string {
  return new Intl.NumberFormat(INTL_TAGS[locale], {
    style: "currency",
    currency: "EUR",
    useGrouping: "always",
  }).format(value);
}

export function formatPercent(locale: Locale, ratio: number): string {
  return new Intl.NumberFormat(INTL_TAGS[locale], {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(ratio);
}

export function formatDate(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(INTL_TAGS[locale], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
