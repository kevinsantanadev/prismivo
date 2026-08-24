"use client";

import { useEffect } from "react";
import {
  supportedAccentColors,
  supportedColorVisionModes,
  supportedContentWidths,
  supportedCornerStyles,
  supportedInterfaceDensities,
  supportedInterfaceFilters,
  supportedLocales,
  supportedMotionModes,
  supportedSidebarModes,
  supportedTextScales,
  supportedThemes,
  useSitePreferences,
  type AccentColor,
  type ColorVisionMode,
  type ContentWidth,
  type CornerStyle,
  type InterfaceDensity,
  type InterfaceFilter,
  type MotionMode,
  type SidebarMode,
  type SiteLocale,
  type SiteTheme,
  type TextScale,
} from "@/app/components/site-preferences";

type WorkspacePreferencesSyncProps = {
  locale: string;
  theme: string;
  accentColor: string;
  interfaceFilter: string;
  colorVisionMode: string;
  sidebarMode: string;
  interfaceDensity: string;
  contentWidth: string;
  cornerStyle: string;
  textScale: string;
  motionMode: string;
};

/** Makes the saved account preferences authoritative on every private route. */
export function WorkspacePreferencesSync({
  locale,
  theme,
  accentColor,
  interfaceFilter,
  colorVisionMode,
  sidebarMode,
  interfaceDensity,
  contentWidth,
  cornerStyle,
  textScale,
  motionMode,
}: WorkspacePreferencesSyncProps) {
  const {
    setLocale,
    setTheme,
    setAccentColor,
    setInterfaceFilter,
    setColorVisionMode,
    setSidebarMode,
    setInterfaceDensity,
    setContentWidth,
    setCornerStyle,
    setTextScale,
    setMotionMode,
    markWorkspacePreferencesAuthoritative,
  } = useSitePreferences();

  useEffect(() => {
    markWorkspacePreferencesAuthoritative();
    if (supportedLocales.includes(locale as SiteLocale)) setLocale(locale as SiteLocale);
    if (supportedThemes.includes(theme as SiteTheme)) setTheme(theme as SiteTheme);
    if (supportedAccentColors.includes(accentColor as AccentColor)) setAccentColor(accentColor as AccentColor);
    if (supportedInterfaceFilters.includes(interfaceFilter as InterfaceFilter)) setInterfaceFilter(interfaceFilter as InterfaceFilter);
    if (supportedColorVisionModes.includes(colorVisionMode as ColorVisionMode)) setColorVisionMode(colorVisionMode as ColorVisionMode);
    if (supportedSidebarModes.includes(sidebarMode as SidebarMode)) setSidebarMode(sidebarMode as SidebarMode);
    if (supportedInterfaceDensities.includes(interfaceDensity as InterfaceDensity)) setInterfaceDensity(interfaceDensity as InterfaceDensity);
    if (supportedContentWidths.includes(contentWidth as ContentWidth)) setContentWidth(contentWidth as ContentWidth);
    if (supportedCornerStyles.includes(cornerStyle as CornerStyle)) setCornerStyle(cornerStyle as CornerStyle);
    if (supportedTextScales.includes(textScale as TextScale)) setTextScale(textScale as TextScale);
    if (supportedMotionModes.includes(motionMode as MotionMode)) setMotionMode(motionMode as MotionMode);
  }, [accentColor, colorVisionMode, contentWidth, cornerStyle, interfaceDensity, interfaceFilter, locale, markWorkspacePreferencesAuthoritative, motionMode, setAccentColor, setColorVisionMode, setContentWidth, setCornerStyle, setInterfaceDensity, setInterfaceFilter, setLocale, setMotionMode, setSidebarMode, setTextScale, setTheme, sidebarMode, textScale, theme]);

  return null;
}
