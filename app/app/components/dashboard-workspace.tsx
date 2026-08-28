"use client";

import type { ReactNode } from "react";
import { Check, LayoutDashboard, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { dashboardWidgetIds, defaultDashboardWidgets, type DashboardWidgetId } from "@/lib/marco23";
import { getMarco23Copy } from "@/lib/marco23-i18n";
import type { SiteLocale } from "@/lib/site-locale";

const storageKey = "prismivo:marco23:dashboard-widgets";
const storageEvent = "prismivo-dashboard-widgets";
const defaultSnapshot = JSON.stringify(defaultDashboardWidgets);

export function DashboardWorkspace({
  locale,
  widgets,
}: {
  locale: SiteLocale;
  widgets: Record<DashboardWidgetId, ReactNode>;
}) {
  const copy = getMarco23Copy(locale).dashboard;
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const snapshot = useSyncExternalStore(subscribeToDashboardWidgets, getDashboardWidgetSnapshot, () => defaultSnapshot);
  const enabled = normalizeWidgets(JSON.parse(snapshot));
  const [draft, setDraft] = useState<DashboardWidgetId[]>([...defaultDashboardWidgets]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  function toggle(widget: DashboardWidgetId) {
    setMessage("");
    setDraft((current) => current.includes(widget)
      ? current.length <= 3 ? current : current.filter((item) => item !== widget)
      : dashboardWidgetIds.filter((item) => [...current, widget].includes(item)));
  }

  function save() {
    const normalized = normalizeWidgets(draft);
    window.localStorage.setItem(storageKey, JSON.stringify(normalized));
    window.dispatchEvent(new Event(storageEvent));
    setMessage(copy.saved);
    setOpen(false);
  }

  function reset() {
    setDraft([...defaultDashboardWidgets]);
    setMessage("");
  }

  return (
    <>
      <div className="dashboard-command-bar">
        <span>{message}</span>
        <button ref={triggerRef} className="app-secondary-button" type="button" onClick={() => { setDraft(enabled); setOpen(true); }}><SlidersHorizontal aria-hidden="true" />{copy.customize}</button>
      </div>
      <div className="dashboard-widget-layout">
        {dashboardWidgetIds.filter((widget) => enabled.includes(widget)).map((widget) => <div className={`dashboard-widget-slot widget-${widget}`} data-dashboard-widget={widget} key={widget}>{widgets[widget]}</div>)}
      </div>

      {open && (
        <div className="app-dialog-backdrop dashboard-customizer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className="app-dialog dashboard-customizer" role="dialog" aria-modal="true" aria-labelledby="dashboard-customizer-title">
            <header className="project-form-heading">
              <div><span className="panel-kicker">{copy.dialogEyebrow}</span><h2 id="dashboard-customizer-title">{copy.dialogTitle}</h2></div>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label={copy.close}><X aria-hidden="true" /></button>
            </header>
            <p>{copy.dialogIntro}</p>
            <div className="dashboard-widget-options">
              {dashboardWidgetIds.map((widget) => {
                const selected = draft.includes(widget);
                const [title, detail] = copy.widgets[widget];
                return <button className={selected ? "selected" : ""} type="button" aria-pressed={selected} onClick={() => toggle(widget)} key={widget}><span>{selected ? <Check aria-hidden="true" /> : <LayoutDashboard aria-hidden="true" />}</span><div><strong>{title}</strong><small>{detail}</small></div></button>;
              })}
            </div>
            <footer className="dialog-actions"><button className="button button-secondary" type="button" onClick={reset}><RotateCcw aria-hidden="true" />{copy.reset}</button><button className="app-primary-button" type="button" onClick={save}>{copy.save}</button></footer>
          </section>
        </div>
      )}
    </>
  );
}

function normalizeWidgets(value: unknown): DashboardWidgetId[] {
  if (!Array.isArray(value)) return [];
  const unique = [...new Set(value.filter((item): item is DashboardWidgetId => typeof item === "string" && dashboardWidgetIds.includes(item as DashboardWidgetId)))];
  return dashboardWidgetIds.filter((widget) => unique.includes(widget));
}

function getDashboardWidgetSnapshot() {
  const value = window.localStorage.getItem(storageKey);
  if (!value) return defaultSnapshot;
  try {
    return normalizeWidgets(JSON.parse(value)).length >= 3 ? value : defaultSnapshot;
  } catch {
    return defaultSnapshot;
  }
}

function subscribeToDashboardWidgets(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(storageEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(storageEvent, onChange);
  };
}
