"use client";

import { Contrast, Globe2, Monitor, Moon, Palette, Sun, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  supportedLocales,
  supportedThemes,
  useSitePreferences,
  type SiteLocale,
  type SiteTheme,
} from "./site-preferences";

const labels: Record<SiteLocale, {
  title: string;
  close: string;
  appearance: string;
  language: string;
  themes: Record<SiteTheme, string>;
  locales: Record<SiteLocale, string>;
}> = {
  "pt-BR": {
    title: "Preferências de aparência e idioma",
    close: "Fechar preferências",
    appearance: "Aparência",
    language: "Idioma",
    themes: { system: "Automático", light: "Claro", dark: "Escuro", mono: "Preto e branco" },
    locales: { "pt-BR": "Português do Brasil", en: "English", es: "Español" },
  },
  en: {
    title: "Appearance and language preferences",
    close: "Close preferences",
    appearance: "Appearance",
    language: "Language",
    themes: { system: "System", light: "Light", dark: "Dark", mono: "Black and white" },
    locales: { "pt-BR": "Português do Brasil", en: "English", es: "Español" },
  },
  es: {
    title: "Preferencias de apariencia e idioma",
    close: "Cerrar preferencias",
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const positionDialog = useCallback(() => {
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    if (!dialog || !trigger || window.matchMedia("(max-width: 700px)").matches) return;

    const triggerBounds = trigger.getBoundingClientRect();
    const panelWidth = Math.min(360, window.innerWidth - 24);
    const preferredLeft = align === "right"
      ? triggerBounds.right - panelWidth
      : triggerBounds.left;
    const left = Math.min(
      Math.max(12, preferredLeft),
      Math.max(12, window.innerWidth - panelWidth - 12),
    );

    dialog.style.setProperty("--preferences-left", `${left}px`);
    dialog.style.setProperty("--preferences-top", `${triggerBounds.bottom + 12}px`);
  }, [align]);

  const openDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    positionDialog();
    dialog.showModal();
    setIsOpen(true);
  };

  const closeDialog = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleViewportChange = () => positionDialog();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
    };
  }, [isOpen, positionDialog]);

  return (
    <div className={`preferences-menu align-${align}`}>
      <button
        ref={triggerRef}
        className="utility-button"
        type="button"
        aria-label={copy.title}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={copy.title}
        onClick={openDialog}
      >
        <Palette size={18} aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        className="preferences-dialog"
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClose={() => {
          setIsOpen(false);
          triggerRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
      >
        <div className="preferences-panel">
          <div className="preferences-panel-header">
            <h2 id={titleId}>{copy.title}</h2>
            <button type="button" onClick={closeDialog} aria-label={copy.close} title={copy.close}>
              <X aria-hidden="true" />
            </button>
          </div>
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
      </dialog>
    </div>
  );
}
