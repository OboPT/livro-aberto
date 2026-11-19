"use client";

import Link from "next/link";
import { LOCALES, LOCALE_STORAGE_KEY, type Locale } from "@/i18n/config";
import type { Translator } from "@/i18n/messages";

function saveLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage can be unavailable (private mode); the URL still holds the locale.
  }
}

export function LanguageSwitcher({
  locale,
  t,
}: {
  locale: Locale;
  t: Translator;
}) {
  return (
    <nav aria-label={t("nav.language_label")} className="language-switcher">
      <ul>
        {LOCALES.map((target) => (
          <li key={target}>
            <Link
              href={`/${target}/`}
              lang={target}
              hrefLang={target}
              aria-current={target === locale ? "true" : undefined}
              onClick={() => saveLocale(target)}
            >
              {t(`language.${target}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
