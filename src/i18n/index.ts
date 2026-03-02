import en from "./en";
import fr from "./fr";

export type Locale = "en" | "fr";
export type TranslationKey = keyof typeof en;

const translations: Record<Locale, Record<TranslationKey, string>> = { en, fr };

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}

export function getLocaleFromPath(path: string): Locale {
  if (path.startsWith("/fr/") || path === "/fr") return "fr";
  return "en";
}

/** Given a path, return the equivalent path in the other locale */
export function getAlternatePath(path: string, targetLocale: Locale): string {
  // Strip trailing slash (except root)
  const clean = path === "/" ? "/" : path.replace(/\/$/, "");

  // Extract the "inner" path without locale prefix
  let inner: string;
  if (clean.startsWith("/fr/")) {
    inner = clean.slice(3); // "/fr/projects" -> "/projects"
  } else if (clean === "/fr") {
    inner = "/";
  } else {
    inner = clean; // already EN (no prefix)
  }

  if (targetLocale === "en") {
    return inner || "/";
  }
  // FR
  return inner === "/" ? "/fr" : `/fr${inner}`;
}

export const locales: Locale[] = ["en", "fr"];
