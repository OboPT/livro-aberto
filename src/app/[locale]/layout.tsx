import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { LOCALES, isLocale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import "../globals.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Params = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: t("app.title"),
    description: t("app.subtitle"),
    alternates: {
      canonical: `${BASE_PATH}/${locale}/`,
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${BASE_PATH}/${l}/`]),
      ),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Params & { children: ReactNode }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
