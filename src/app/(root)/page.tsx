"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LOCALE_STORAGE_KEY,
  LOCALES,
  resolveLocale,
} from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";

const t = createTranslator("pt");

function readSavedLocale(): string | null {
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function RootRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const locale = resolveLocale(readSavedLocale(), navigator.languages);
    router.replace(`/${locale}/`);
  }, [router]);

  return (
    <main>
      <ul>
        {LOCALES.map((locale) => (
          <li key={locale}>
            <a href={`${locale}/`} lang={locale}>
              {t(`language.${locale}`)}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
