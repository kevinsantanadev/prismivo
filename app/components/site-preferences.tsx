"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const supportedLocales = ["pt-BR", "en", "es"] as const;
export const supportedThemes = ["system", "light", "dark", "mono"] as const;
export const supportedAccentColors = ["lime", "violet", "blue", "amber", "teal", "rose"] as const;
export const supportedInterfaceFilters = ["none", "soft", "crisp", "grayscale"] as const;
export const supportedColorVisionModes = ["standard", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as const;

export type SiteLocale = (typeof supportedLocales)[number];
export type SiteTheme = (typeof supportedThemes)[number];
export type AccentColor = (typeof supportedAccentColors)[number];
export type InterfaceFilter = (typeof supportedInterfaceFilters)[number];
export type ColorVisionMode = (typeof supportedColorVisionModes)[number];

type PreferencesContextValue = {
  locale: SiteLocale;
  setLocale: (locale: SiteLocale) => void;
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  interfaceFilter: InterfaceFilter;
  setInterfaceFilter: (filter: InterfaceFilter) => void;
  colorVisionMode: ColorVisionMode;
  setColorVisionMode: (mode: ColorVisionMode) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function isLocale(value: string | null): value is SiteLocale {
  return supportedLocales.includes(value as SiteLocale);
}

function isTheme(value: string | null): value is SiteTheme {
  return supportedThemes.includes(value as SiteTheme);
}

function includesValue<T extends string>(values: readonly T[], value: string | null): value is T {
  return values.includes(value as T);
}

export function SitePreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<SiteLocale>("pt-BR");
  const [theme, updateTheme] = useState<SiteTheme>("system");
  const [accentColor, updateAccentColor] = useState<AccentColor>("lime");
  const [interfaceFilter, updateInterfaceFilter] = useState<InterfaceFilter>("none");
  const [colorVisionMode, updateColorVisionMode] = useState<ColorVisionMode>("standard");

  useEffect(() => {
    const storedLocale = window.localStorage.getItem("prismivo-locale");
    const storedTheme = window.localStorage.getItem("prismivo-theme");
    const storedAccent = window.localStorage.getItem("prismivo-accent");
    const storedFilter = window.localStorage.getItem("prismivo-interface-filter");
    const storedColorVision = window.localStorage.getItem("prismivo-color-vision");
    queueMicrotask(() => {
      if (isLocale(storedLocale)) updateLocale(storedLocale);
      if (isTheme(storedTheme)) updateTheme(storedTheme);
      if (includesValue(supportedAccentColors, storedAccent)) updateAccentColor(storedAccent);
      if (includesValue(supportedInterfaceFilters, storedFilter)) updateInterfaceFilter(storedFilter);
      if (includesValue(supportedColorVisionModes, storedColorVision)) updateColorVisionMode(storedColorVision);
    });
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved === "light" ? "light" : "dark";
    };

    applyTheme();
    media.addEventListener("change", applyTheme);
    window.localStorage.setItem("prismivo-theme", theme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("prismivo-locale", locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.accent = accentColor;
    document.documentElement.dataset.interfaceFilter = interfaceFilter;
    document.documentElement.dataset.colorVision = colorVisionMode;
    window.localStorage.setItem("prismivo-accent", accentColor);
    window.localStorage.setItem("prismivo-interface-filter", interfaceFilter);
    window.localStorage.setItem("prismivo-color-vision", colorVisionMode);
  }, [accentColor, interfaceFilter, colorVisionMode]);

  const setLocale = useCallback((nextLocale: SiteLocale) => updateLocale(nextLocale), []);
  const setTheme = useCallback((nextTheme: SiteTheme) => updateTheme(nextTheme), []);
  const setAccentColor = useCallback((nextColor: AccentColor) => updateAccentColor(nextColor), []);
  const setInterfaceFilter = useCallback((nextFilter: InterfaceFilter) => updateInterfaceFilter(nextFilter), []);
  const setColorVisionMode = useCallback((nextMode: ColorVisionMode) => updateColorVisionMode(nextMode), []);
  const value = useMemo(
    () => ({ locale, setLocale, theme, setTheme, accentColor, setAccentColor, interfaceFilter, setInterfaceFilter, colorVisionMode, setColorVisionMode }),
    [locale, setLocale, theme, setTheme, accentColor, setAccentColor, interfaceFilter, setInterfaceFilter, colorVisionMode, setColorVisionMode],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useSitePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("useSitePreferences must be used inside SitePreferencesProvider");
  return context;
}
