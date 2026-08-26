"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellRing, CheckCircle2, ChevronRight, Radar, Save, Workflow } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { defaultSmartRoutines, getSmartAlerts, type AgendaEvent, type SmartRoutineId, type SmartRoutinePreferences } from "@/lib/marco23";
import { getMarco23Copy } from "@/lib/marco23-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";

const routineIds: SmartRoutineId[] = ["task", "approval", "project"];
const storageKey = "prismivo:marco23:smart-routines";
const storageEvent = "prismivo-smart-routines";
const defaultSnapshot = JSON.stringify(defaultSmartRoutines);

export function SmartRoutines({ events, locale, today }: { events: AgendaEvent[]; locale: SiteLocale; today: string }) {
  const router = useRouter();
  const copy = getMarco23Copy(locale).routines;
  const snapshot = useSyncExternalStore(subscribeToSmartRoutines, getSmartRoutineSnapshot, () => defaultSnapshot);
  const savedPreferences = parseRoutinePreferences(snapshot);
  const [draft, setDraft] = useState<SmartRoutinePreferences | null>(null);
  const preferences = draft ?? savedPreferences;
  const [message, setMessage] = useState("");
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const alerts = getSmartAlerts(events, savedPreferences, today);

  function update(id: SmartRoutineId, field: "enabled" | "leadDays", value: boolean | number) {
    setMessage("");
    setDraft((current) => {
      const base = current ?? savedPreferences;
      return { ...base, [id]: { ...base[id], [field]: value } };
    });
  }

  function save() {
    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
    window.dispatchEvent(new Event(storageEvent));
    setDraft(null);
    setMessage(copy.saved);
  }

  return (
    <div className="routines-layout">
      <section className="dashboard-panel routine-rules" aria-labelledby="routine-rules-title">
        <div className="panel-heading"><div><span className="panel-kicker">BETA LOCAL</span><h2 id="routine-rules-title">{copy.navTitle}</h2></div><Workflow aria-hidden="true" /></div>
        <div className="routine-rule-list">
          {routineIds.map((id) => {
            const [title, detail] = copy.rules[id];
            const setting = preferences[id];
            return <article className={setting.enabled ? "enabled" : ""} key={id}>
              <button className="routine-toggle" type="button" role="switch" aria-checked={setting.enabled} aria-label={`${title}: ${setting.enabled ? copy.active : copy.inactive}`} onClick={() => update(id, "enabled", !setting.enabled)}><span /><strong>{setting.enabled ? copy.active : copy.inactive}</strong></button>
              <div><h3>{title}</h3><p>{detail}</p></div>
              <label><span>{copy.lead}</span><select value={setting.leadDays} onChange={(event) => update(id, "leadDays", Number(event.target.value))} disabled={!setting.enabled}>{[0, 1, 2, 3, 5, 7, 14].map((days) => <option value={days} key={days}>{days} {copy.days}</option>)}</select></label>
            </article>;
          })}
        </div>
        <div className="routine-actions"><span role="status">{message}</span><button className="app-primary-button" type="button" onClick={save}><Save aria-hidden="true" />{copy.save}</button></div>
        <p className="routine-device-note">{copy.deviceNote}</p>
      </section>

      <section className="dashboard-panel routine-alerts" aria-labelledby="routine-alerts-title">
        <div className="panel-heading"><div><span className="panel-kicker">MONITOR</span><h2 id="routine-alerts-title">{copy.alertTitle}</h2>{lastScan && <small className="routine-last-scan">{new Intl.DateTimeFormat(toIntlLocale(locale), { hour: "2-digit", minute: "2-digit" }).format(lastScan)}</small>}</div><button type="button" onClick={() => { router.refresh(); setLastScan(new Date()); }}><Radar aria-hidden="true" />{copy.scan}</button></div>
        {alerts.length === 0 ? <div className="empty-state compact"><CheckCircle2 aria-hidden="true" /><h3>{copy.noAlerts}</h3><p>{copy.noAlertsDetail}</p></div> : <div className="routine-alert-list">{alerts.map((alert) => <article key={alert.id}><span className={`routine-alert-icon kind-${alert.kind}`}><BellRing aria-hidden="true" /></span><div><span>{getMarco23Copy(locale).agenda.kinds[alert.kind]}</span><h3>{alert.title}</h3><p>{alert.context}{alert.clientName && alert.clientName !== alert.context ? ` · ${alert.clientName}` : ""}</p><time dateTime={alert.date}>{new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium" }).format(new Date(`${alert.date}T12:00:00`))}</time></div><Link href={alert.href} aria-label={`${copy.open}: ${alert.title}`}><span>{copy.open}</span><ChevronRight aria-hidden="true" /></Link></article>)}</div>}
      </section>
    </div>
  );
}

function isRoutinePreferences(value: unknown): value is SmartRoutinePreferences {
  if (!value || typeof value !== "object") return false;
  return routineIds.every((id) => {
    const item = (value as Record<string, unknown>)[id];
    if (!item || typeof item !== "object") return false;
    const candidate = item as Record<string, unknown>;
    return typeof candidate.enabled === "boolean" && typeof candidate.leadDays === "number" && candidate.leadDays >= 0 && candidate.leadDays <= 30;
  });
}

function parseRoutinePreferences(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRoutinePreferences(parsed) ? parsed : defaultSmartRoutines;
  } catch {
    return defaultSmartRoutines;
  }
}

function getSmartRoutineSnapshot() {
  const value = window.localStorage.getItem(storageKey);
  if (!value) return defaultSnapshot;
  try {
    return isRoutinePreferences(JSON.parse(value)) ? value : defaultSnapshot;
  } catch {
    return defaultSnapshot;
  }
}

function subscribeToSmartRoutines(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(storageEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(storageEvent, onChange);
  };
}
