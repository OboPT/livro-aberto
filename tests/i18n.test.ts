import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { THRESHOLDS, type FlagCode } from "@/domain/diagnosis";
import { EXPENSE_CATEGORIES } from "@/domain/types";
import type { ValidationErrorCode } from "@/domain/validation";
import {
  DEFAULT_LOCALE,
  LOCALES,
  matchBrowserLanguage,
  resolveLocale,
} from "@/i18n/config";
import { formatCurrency, formatDate, formatPercent } from "@/i18n/format";
import { MESSAGES, createTranslator } from "@/i18n/messages";

const keysOf = (locale: (typeof LOCALES)[number]) =>
  Object.keys(MESSAGES[locale]).sort();

describe("translation files", () => {
  it("have the same keys in every locale (none missing, none extra)", () => {
    const reference = keysOf("pt");
    for (const locale of LOCALES) {
      expect(keysOf(locale), `locale ${locale}`).toEqual(reference);
    }
  });

  it("have no empty strings", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(MESSAGES[locale])) {
        expect(value.trim(), `${locale}:${key}`).not.toBe("");
      }
    }
  });

  it("cover every key used statically in the source", () => {
    const used = new Set<string>();
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(name)) {
          const source = readFileSync(full, "utf8");
          for (const match of source.matchAll(/\bt\(\s*["'`]([a-z_.]+)["'`]/g)) {
            used.add(match[1]);
          }
        }
      }
    };
    walk(path.resolve(__dirname, "../src"));
    expect(used.size).toBeGreaterThan(0);
    for (const key of used) {
      expect(MESSAGES.pt[key], `missing key ${key}`).toBeDefined();
    }
  });

  it("cover every dynamic key built from domain enums", () => {
    const flags: FlagCode[] = [
      "no_income",
      "negative_surplus",
      "low_savings_rate",
      "high_debt_service",
      "high_apr_debt",
      "no_investments",
    ];
    const errors: ValidationErrorCode[] = [
      "label_required",
      "amount_invalid",
      "apr_invalid",
    ];
    const keys = [
      ...EXPENSE_CATEGORIES.map((c) => `category.${c}`),
      ...["loan", "card"].map((k) => `debt_kind.${k}`),
      ...flags.map((f) => `diagnosis.flag.${f}`),
      ...errors.map((e) => `error.${e}`),
      ...LOCALES.map((l) => `language.${l}`),
    ];
    for (const locale of LOCALES) {
      for (const key of keys) {
        expect(MESSAGES[locale][key], `${locale}:${key}`).toBeDefined();
      }
    }
  });

  it("mention the same thresholds the diagnosis uses", () => {
    for (const locale of LOCALES) {
      const text = (key: string) => MESSAGES[locale][key];
      expect(text("diagnosis.flag.low_savings_rate")).toContain(
        `${THRESHOLDS.lowSavingsRate * 100}%`,
      );
      expect(text("diagnosis.flag.high_debt_service")).toContain(
        `${THRESHOLDS.highDebtServiceRatio * 100}%`,
      );
      expect(text("diagnosis.flag.high_apr_debt")).toContain(
        `${THRESHOLDS.highAprCard}%`,
      );
      expect(text("diagnosis.flag.high_apr_debt")).toContain(
        `${THRESHOLDS.highAprLoan}%`,
      );
    }
  });

  it("show full language names, not flags", () => {
    for (const locale of LOCALES) {
      expect(MESSAGES[locale]["language.pt"]).toBe("Português");
      expect(MESSAGES[locale]["language.es"]).toBe("Español");
      expect(MESSAGES[locale]["language.en"]).toBe("English");
    }
  });
});

describe("translator", () => {
  it("throws on a missing key instead of falling back silently", () => {
    expect(() => createTranslator("en")("does.not.exist")).toThrow(/Missing/);
  });
});

describe("locale resolution", () => {
  it("prefers the saved locale over the browser", () => {
    expect(resolveLocale("es", ["en-US"])).toBe("es");
  });
  it("uses the browser language when nothing is saved", () => {
    expect(resolveLocale(null, ["fr-FR", "es-MX"])).toBe("es");
  });
  it("falls back to pt", () => {
    expect(resolveLocale(null, ["fr-FR"])).toBe(DEFAULT_LOCALE);
    expect(DEFAULT_LOCALE).toBe("pt");
  });
  it("ignores an invalid saved value", () => {
    expect(resolveLocale("xx", ["en"])).toBe("en");
    expect(matchBrowserLanguage([])).toBeNull();
  });
});

describe("formatting per locale", () => {
  const normalize = (text: string) => text.replace(/[\s  ]/g, " ");

  it("formats currency", () => {
    expect(normalize(formatCurrency("pt", 1234.56))).toBe("1 234,56 €");
    expect(normalize(formatCurrency("es", 1234.56))).toBe("1.234,56 €");
    expect(normalize(formatCurrency("en", 1234.56))).toBe("€1,234.56");
  });

  it("formats dates (7 November 2026)", () => {
    const date = new Date(Date.UTC(2026, 10, 7));
    expect(formatDate("pt", date)).toBe("07/11/2026");
    expect(formatDate("es", date)).toBe("07/11/2026");
    expect(formatDate("en", date)).toBe("11/07/2026");
  });

  it("formats percentages", () => {
    expect(normalize(formatPercent("pt", 0.123))).toBe("12,3%");
    expect(normalize(formatPercent("en", 0.123))).toBe("12.3%");
  });
});
