export const LOCALES = ["pt", "es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt";
export const LOCALE_STORAGE_KEY = "livro-aberto:locale";

/** BCP 47 tags used by Intl for each supported locale. */
export const INTL_TAGS: Record<Locale, string> = {
  pt: "pt-PT",
  es: "es-ES",
  en: "en-US",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}

/** Maps a browser language such as "es-MX" to a supported locale, or null. */
export function matchBrowserLanguage(
  languages: readonly string[],
): Locale | null {
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}

/** Preference order: saved choice, then browser language, then default. */
export function resolveLocale(
  saved: string | null | undefined,
  browserLanguages: readonly string[],
): Locale {
  if (isLocale(saved)) return saved;
  return matchBrowserLanguage(browserLanguages) ?? DEFAULT_LOCALE;
}
