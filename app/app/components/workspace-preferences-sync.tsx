"use client";

import { useEffect } from "react";
import {
  supportedAccentColors,
  supportedColorVisionModes,
  supportedInterfaceFilters,
  supportedLocales,
  supportedThemes,
  useSitePreferences,
  type AccentColor,
  type ColorVisionMode,
  type InterfaceFilter,
  type SiteLocale,
  type SiteTheme,
} from "@/app/components/site-preferences";

type WorkspacePreferencesSyncProps = {
  locale: string;
  theme: string;
  accentColor: string;
  interfaceFilter: string;
  colorVisionMode: string;
};

/** Makes the saved account preferences authoritative on every private route. */
export function WorkspacePreferencesSync({
  locale,
  theme,
  accentColor,
  interfaceFilter,
  colorVisionMode,
}: WorkspacePreferencesSyncProps) {
  const {
    setLocale,
    setTheme,
    setAccentColor,
    setInterfaceFilter,
    setColorVisionMode,
  } = useSitePreferences();

  useEffect(() => {
    if (supportedLocales.includes(locale as SiteLocale)) setLocale(locale as SiteLocale);
    if (supportedThemes.includes(theme as SiteTheme)) setTheme(theme as SiteTheme);
    if (supportedAccentColors.includes(accentColor as AccentColor)) setAccentColor(accentColor as AccentColor);
    if (supportedInterfaceFilters.includes(interfaceFilter as InterfaceFilter)) setInterfaceFilter(interfaceFilter as InterfaceFilter);
    if (supportedColorVisionModes.includes(colorVisionMode as ColorVisionMode)) setColorVisionMode(colorVisionMode as ColorVisionMode);
  }, [accentColor, colorVisionMode, interfaceFilter, locale, setAccentColor, setColorVisionMode, setInterfaceFilter, setLocale, setTheme, theme]);

  return null;
}
