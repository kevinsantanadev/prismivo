"use client";

import { Contrast, Globe2, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  supportedLocales,
  supportedThemes,
  useSitePreferences,
  type SiteLocale,
  type SiteTheme,
} from "./site-preferences";

const labels: Record<SiteLocale, {
  title: string;
  appearance: string;
  language: string;
  themes: Record<SiteTheme, string>;
  locales: Record<SiteLocale, string>;
}> = {
  "pt-BR": {
    title: "Preferências de aparência e idioma",
    appearance: "Aparência",
    language: "Idioma",
    themes: { system: "Automático", light: "Claro", dark: "Escuro", mono: "Preto e branco" },
    locales: { "pt-BR": "Português do Brasil", en: "English", es: "Español" },
  },
  en: {
    title: "Appearance and language preferences",
    appearance: "Appearance",
    language: "Language",
    themes: { system: "System", light: "Light", dark: "Dark", mono: "Black and white" },
    locales: { "pt-BR": "Português do Brasil", en: "English", es: "Español" },
  },
  es: {
    title: "Preferencias de apariencia e idioma",
    appearance: "Apariencia",
    language: "Idioma",
    themes: { system: "Sistema", light: "Claro", dark: "Oscuro", mono: "Blanco y negro" },
    locales: { "pt-BR": "Português do Brasil", en: "English", es: "Español" },
  },
};

const themeIcons = { system: Monitor, light: Sun, dark: Moon, mono: Contrast } as const;

export function PreferencesMenu({ align = "right" }: { align?: "left" | "right" }) {
  const router = useRouter();
  const { locale, setLocale, theme, setTheme } = useSitePreferences();
  const copy = labels[locale];

  return (
    <details className={`preferences-menu align-${align}`}>
      <summary className="utility-button" aria-label={copy.title} title={copy.title}>
        <Palette size={18} aria-hidden="true" />
      </summary>
      <div className="preferences-panel">
        <fieldset>
          <legend>{copy.appearance}</legend>
          <div className="theme-options">
            {supportedThemes.map((option) => {
              const Icon = themeIcons[option];
              return (
                <button
                  className={theme === option ? "active" : ""}
                  type="button"
                  key={option}
                  onClick={() => setTheme(option)}
                  aria-pressed={theme === option}
                >
                  <Icon aria-hidden="true" />
                  <span>{copy.themes[option]}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="language-preference">
          <span><Globe2 aria-hidden="true" />{copy.language}</span>
          <select
            aria-label={copy.language}
            value={locale}
            onChange={(event) => {
              setLocale(event.target.value as SiteLocale);
              router.refresh();
            }}
          >
            {supportedLocales.map((option) => <option key={option} value={option}>{copy.locales[option]}</option>)}
          </select>
        </label>
      </div>
    </details>
  );
}
