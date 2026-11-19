import pt from "../../locales/pt.json";
import es from "../../locales/es.json";
import en from "../../locales/en.json";
import type { Locale } from "./config";

type Tree = { [key: string]: string | Tree };

const trees: Record<Locale, Tree> = { pt, es, en };

export function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix === "" ? key : `${prefix}.${key}`;
    if (typeof value === "string") result[path] = value;
    else Object.assign(result, flatten(value, path));
  }
  return result;
}

export const MESSAGES: Record<Locale, Record<string, string>> = {
  pt: flatten(trees.pt),
  es: flatten(trees.es),
  en: flatten(trees.en),
};

export type Translator = (
  key: string,
  params?: Record<string, string | number>,
) => string;

/** Throws on a missing key so gaps fail loudly instead of falling back. */
export function createTranslator(locale: Locale): Translator {
  const messages = MESSAGES[locale];
  return (key, params) => {
    const template = messages[key];
    if (template === undefined) {
      throw new Error(`Missing translation key "${key}" for locale "${locale}"`);
    }
    return template.replace(/\{(\w+)\}/g, (_, name: string) =>
      String(params?.[name] ?? `{${name}}`),
    );
  };
}
