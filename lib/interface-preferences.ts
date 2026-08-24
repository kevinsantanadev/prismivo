export const supportedThemes = ["system", "light", "dark", "mono"] as const;
export const supportedAccentColors = ["lime", "violet", "blue", "amber", "teal", "rose"] as const;
export const supportedInterfaceFilters = ["none", "soft", "crisp", "grayscale"] as const;
export const supportedColorVisionModes = ["standard", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as const;
export const supportedSidebarModes = ["adaptive", "light", "dark", "brand"] as const;
export const supportedInterfaceDensities = ["compact", "comfortable", "spacious"] as const;
export const supportedContentWidths = ["focused", "standard", "wide"] as const;
export const supportedCornerStyles = ["soft", "rounded", "square"] as const;
export const supportedTextScales = ["default", "large", "extra-large"] as const;
export const supportedMotionModes = ["system", "full", "reduced"] as const;
export const supportedQuickNavigationSections = [
  "dashboard",
  "tasks",
  "projects",
  "clients",
  "approvals",
  "files",
  "support",
  "content",
  "notifications",
  "settings",
] as const;

export type SiteTheme = (typeof supportedThemes)[number];
export type AccentColor = (typeof supportedAccentColors)[number];
export type InterfaceFilter = (typeof supportedInterfaceFilters)[number];
export type ColorVisionMode = (typeof supportedColorVisionModes)[number];
export type SidebarMode = (typeof supportedSidebarModes)[number];
export type InterfaceDensity = (typeof supportedInterfaceDensities)[number];
export type ContentWidth = (typeof supportedContentWidths)[number];
export type CornerStyle = (typeof supportedCornerStyles)[number];
export type TextScale = (typeof supportedTextScales)[number];
export type MotionMode = (typeof supportedMotionModes)[number];
export type QuickNavigationSection = (typeof supportedQuickNavigationSections)[number];

export const defaultPrimaryNavigation: readonly QuickNavigationSection[] = [
  "dashboard",
  "tasks",
  "projects",
  "clients",
];

export function includesPreference<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && values.includes(value as T);
}

/** Accepts PostgreSQL arrays and the comma-separated D1 fallback without trusting either source. */
export function normalizePrimaryNavigation(value: unknown): QuickNavigationSection[] {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  const normalized = candidates
    .map((item) => typeof item === "string" ? item.trim() : "")
    .filter((item): item is QuickNavigationSection => includesPreference(supportedQuickNavigationSections, item));
  const unique = [...new Set(normalized)];

  for (const fallback of defaultPrimaryNavigation) {
    if (unique.length === 4) break;
    if (!unique.includes(fallback)) unique.push(fallback);
  }

  return unique.slice(0, 4);
}
