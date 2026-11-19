import type { MetadataRoute } from "next";
import { LOCALES } from "@/i18n/config";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (locale: string) => `${SITE_URL}${BASE_PATH}/${locale}/`;
  return LOCALES.map((locale) => ({
    url: url(locale),
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, url(l)])),
    },
  }));
}
