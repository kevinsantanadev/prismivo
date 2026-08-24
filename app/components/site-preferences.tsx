"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  SITE_LOCALE_COOKIE,
  supportedLocales,
  type SiteLocale,
} from "@/lib/site-locale";
import {
  includesPreference,
  supportedAccentColors,
  supportedColorVisionModes,
  supportedContentWidths,
  supportedCornerStyles,
  supportedInterfaceDensities,
  supportedInterfaceFilters,
  supportedMotionModes,
  supportedSidebarModes,
  supportedTextScales,
  supportedThemes,
  type AccentColor,
  type ColorVisionMode,
  type ContentWidth,
  type CornerStyle,
  type InterfaceDensity,
  type InterfaceFilter,
  type MotionMode,
  type SidebarMode,
  type SiteTheme,
  type TextScale,
} from "@/lib/interface-preferences";

export { supportedLocales, type SiteLocale };
export {
  supportedAccentColors,
  supportedColorVisionModes,
  supportedContentWidths,
  supportedCornerStyles,
  supportedInterfaceDensities,
  supportedInterfaceFilters,
  supportedMotionModes,
  supportedSidebarModes,
  supportedTextScales,
  supportedThemes,
};
export type {
  AccentColor,
  ColorVisionMode,
  ContentWidth,
  CornerStyle,
  InterfaceDensity,
  InterfaceFilter,
  MotionMode,
  SidebarMode,
  SiteTheme,
  TextScale,
};

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
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
  interfaceDensity: InterfaceDensity;
  setInterfaceDensity: (density: InterfaceDensity) => void;
  contentWidth: ContentWidth;
  setContentWidth: (width: ContentWidth) => void;
  cornerStyle: CornerStyle;
  setCornerStyle: (style: CornerStyle) => void;
  textScale: TextScale;
  setTextScale: (scale: TextScale) => void;
  motionMode: MotionMode;
  setMotionMode: (mode: MotionMode) => void;
  markWorkspacePreferencesAuthoritative: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function isLocale(value: string | null): value is SiteLocale {
  return supportedLocales.includes(value as SiteLocale);
}

function isTheme(value: string | null): value is SiteTheme {
  return supportedThemes.includes(value as SiteTheme);
}

export function SitePreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<SiteLocale>("pt-BR");
  const [theme, updateTheme] = useState<SiteTheme>("system");
  const [accentColor, updateAccentColor] = useState<AccentColor>("lime");
  const [interfaceFilter, updateInterfaceFilter] = useState<InterfaceFilter>("none");
  const [colorVisionMode, updateColorVisionMode] = useState<ColorVisionMode>("standard");
  const [sidebarMode, updateSidebarMode] = useState<SidebarMode>("adaptive");
  const [interfaceDensity, updateInterfaceDensity] = useState<InterfaceDensity>("comfortable");
  const [contentWidth, updateContentWidth] = useState<ContentWidth>("standard");
  const [cornerStyle, updateCornerStyle] = useState<CornerStyle>("rounded");
  const [textScale, updateTextScale] = useState<TextScale>("default");
  const [motionMode, updateMotionMode] = useState<MotionMode>("system");
  const [preferencesReady, setPreferencesReady] = useState(false);
  const workspacePreferencesSyncedRef = useRef(false);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem("prismivo-locale");
    const storedTheme = window.localStorage.getItem("prismivo-theme");
    const storedAccent = window.localStorage.getItem("prismivo-accent");
    const storedFilter = window.localStorage.getItem("prismivo-interface-filter");
    const storedColorVision = window.localStorage.getItem("prismivo-color-vision");
    const storedSidebar = window.localStorage.getItem("prismivo-sidebar-mode");
    const storedDensity = window.localStorage.getItem("prismivo-interface-density");
    const storedContentWidth = window.localStorage.getItem("prismivo-content-width");
    const storedCorners = window.localStorage.getItem("prismivo-corner-style");
    const storedTextScale = window.localStorage.getItem("prismivo-text-scale");
    const storedMotion = window.localStorage.getItem("prismivo-motion-mode");
    queueMicrotask(() => {
      if (!workspacePreferencesSyncedRef.current) {
        if (isLocale(storedLocale)) updateLocale(storedLocale);
        if (isTheme(storedTheme)) updateTheme(storedTheme);
        if (includesPreference(supportedAccentColors, storedAccent)) updateAccentColor(storedAccent);
        if (includesPreference(supportedInterfaceFilters, storedFilter)) updateInterfaceFilter(storedFilter);
        if (includesPreference(supportedColorVisionModes, storedColorVision)) updateColorVisionMode(storedColorVision);
        if (includesPreference(supportedSidebarModes, storedSidebar)) updateSidebarMode(storedSidebar);
        if (includesPreference(supportedInterfaceDensities, storedDensity)) updateInterfaceDensity(storedDensity);
        if (includesPreference(supportedContentWidths, storedContentWidth)) updateContentWidth(storedContentWidth);
        if (includesPreference(supportedCornerStyles, storedCorners)) updateCornerStyle(storedCorners);
        if (includesPreference(supportedTextScales, storedTextScale)) updateTextScale(storedTextScale);
        if (includesPreference(supportedMotionModes, storedMotion)) updateMotionMode(storedMotion);
      }
      setPreferencesReady(true);
    });
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
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
  }, [preferencesReady, theme]);

  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.lang = locale;
    window.localStorage.setItem("prismivo-locale", locale);
  }, [locale, preferencesReady]);

  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.dataset.accent = accentColor;
    document.documentElement.dataset.interfaceFilter = interfaceFilter;
    document.documentElement.dataset.colorVision = colorVisionMode;
    document.documentElement.dataset.sidebarMode = sidebarMode;
    document.documentElement.dataset.interfaceDensity = interfaceDensity;
    document.documentElement.dataset.contentWidth = contentWidth;
    document.documentElement.dataset.cornerStyle = cornerStyle;
    document.documentElement.dataset.textScale = textScale;
    window.localStorage.setItem("prismivo-accent", accentColor);
    window.localStorage.setItem("prismivo-interface-filter", interfaceFilter);
    window.localStorage.setItem("prismivo-color-vision", colorVisionMode);
    window.localStorage.setItem("prismivo-sidebar-mode", sidebarMode);
    window.localStorage.setItem("prismivo-interface-density", interfaceDensity);
    window.localStorage.setItem("prismivo-content-width", contentWidth);
    window.localStorage.setItem("prismivo-corner-style", cornerStyle);
    window.localStorage.setItem("prismivo-text-scale", textScale);
  }, [accentColor, colorVisionMode, contentWidth, cornerStyle, interfaceDensity, interfaceFilter, preferencesReady, sidebarMode, textScale]);

  useEffect(() => {
    if (!preferencesReady) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => {
      document.documentElement.dataset.motion = motionMode === "system"
        ? media.matches ? "reduced" : "full"
        : motionMode;
    };
    applyMotion();
    media.addEventListener("change", applyMotion);
    window.localStorage.setItem("prismivo-motion-mode", motionMode);
    return () => media.removeEventListener("change", applyMotion);
  }, [motionMode, preferencesReady]);

  const setLocale = useCallback((nextLocale: SiteLocale) => {
    document.documentElement.lang = nextLocale;
    window.localStorage.setItem("prismivo-locale", nextLocale);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${SITE_LOCALE_COOKIE}=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    updateLocale(nextLocale);
  }, []);
  const setTheme = useCallback((nextTheme: SiteTheme) => updateTheme(nextTheme), []);
  const setAccentColor = useCallback((nextColor: AccentColor) => updateAccentColor(nextColor), []);
  const setInterfaceFilter = useCallback((nextFilter: InterfaceFilter) => updateInterfaceFilter(nextFilter), []);
  const setColorVisionMode = useCallback((nextMode: ColorVisionMode) => updateColorVisionMode(nextMode), []);
  const setSidebarMode = useCallback((nextMode: SidebarMode) => updateSidebarMode(nextMode), []);
  const setInterfaceDensity = useCallback((nextDensity: InterfaceDensity) => updateInterfaceDensity(nextDensity), []);
  const setContentWidth = useCallback((nextWidth: ContentWidth) => updateContentWidth(nextWidth), []);
  const setCornerStyle = useCallback((nextStyle: CornerStyle) => updateCornerStyle(nextStyle), []);
  const setTextScale = useCallback((nextScale: TextScale) => updateTextScale(nextScale), []);
  const setMotionMode = useCallback((nextMode: MotionMode) => updateMotionMode(nextMode), []);
  const markWorkspacePreferencesAuthoritative = useCallback(() => {
    workspacePreferencesSyncedRef.current = true;
  }, []);
  const value = useMemo(
    () => ({ locale, setLocale, theme, setTheme, accentColor, setAccentColor, interfaceFilter, setInterfaceFilter, colorVisionMode, setColorVisionMode, sidebarMode, setSidebarMode, interfaceDensity, setInterfaceDensity, contentWidth, setContentWidth, cornerStyle, setCornerStyle, textScale, setTextScale, motionMode, setMotionMode, markWorkspacePreferencesAuthoritative }),
    [locale, setLocale, theme, setTheme, accentColor, setAccentColor, interfaceFilter, setInterfaceFilter, colorVisionMode, setColorVisionMode, sidebarMode, setSidebarMode, interfaceDensity, setInterfaceDensity, contentWidth, setContentWidth, cornerStyle, setCornerStyle, textScale, setTextScale, motionMode, setMotionMode, markWorkspacePreferencesAuthoritative],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useSitePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("useSitePreferences must be used inside SitePreferencesProvider");
  return context;
}
