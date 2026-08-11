export const supportedLocales = ["pt-BR", "en", "es"] as const;

export type SiteLocale = (typeof supportedLocales)[number];

export const SITE_LOCALE_COOKIE = "prismivo-locale";

export function normalizeSiteLocale(value: unknown): SiteLocale {
  return typeof value === "string" && supportedLocales.includes(value as SiteLocale)
    ? (value as SiteLocale)
    : "pt-BR";
}

export function toIntlLocale(locale: SiteLocale) {
  return locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR";
}
