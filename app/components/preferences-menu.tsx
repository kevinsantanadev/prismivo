"use client";

import { Contrast, Globe2, Monitor, Moon, Palette, Sun, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
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
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ left: 12, top: 76 });

  const positionPanel = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || window.matchMedia("(max-width: 700px)").matches) return;

    const triggerBounds = trigger.getBoundingClientRect();
    const panelWidth = Math.min(360, window.innerWidth - 24);
    const preferredLeft = align === "right"
      ? triggerBounds.right - panelWidth
      : triggerBounds.left;
    const left = Math.min(
      Math.max(12, preferredLeft),
      Math.max(12, window.innerWidth - panelWidth - 12),
    );

    setPanelPosition({ left, top: triggerBounds.bottom + 12 });
  }, [align]);

  const openPanel = () => {
    if (isOpen) return;
    positionPanel();
    setIsOpen(true);
  };

  const closePanel = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const trigger = triggerRef.current;
    const focusableSelector = [
      "button:not([disabled])",
      "select:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusableElements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("hidden"));
      const firstElement = focusableElements.at(0);
      const lastElement = focusableElements.at(-1);
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const handleViewportChange = () => positionPanel();
    const focusFrame = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("[data-preferences-close]")?.focus();
    });

    document.body.classList.add("preferences-open");
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.classList.remove("preferences-open");
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
      trigger?.focus();
    };
  }, [closePanel, isOpen, positionPanel]);

  const panel = isOpen ? createPortal(
    <div
      className="preferences-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) closePanel();
      }}
    >
      <div
        ref={panelRef}
        id={panelId}
        className="preferences-dialog-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          "--preferences-left": `${panelPosition.left}px`,
          "--preferences-top": `${panelPosition.top}px`,
        } as CSSProperties}
      >
        <div className="preferences-panel">
          <div className="preferences-panel-header">
            <h2 id={titleId}>{copy.title}</h2>
            <button
              data-preferences-close
              type="button"
              onClick={closePanel}
              aria-label={copy.close}
              title={copy.close}
            >
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
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className={`preferences-menu align-${align}`}>
      <button
        ref={triggerRef}
        className="utility-button"
        type="button"
        aria-label={copy.title}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        title={copy.title}
        onClick={openPanel}
      >
        <Palette size={18} aria-hidden="true" />
      </button>
      {panel}
    </div>
  );
}
