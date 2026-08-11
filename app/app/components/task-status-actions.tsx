"use client";
import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";
export function TaskStatusActions({ id, status, locale = "pt-BR" }: { id: string; status: string; locale?: SiteLocale }) {
  const router = useRouter(); const [value, setValue] = useState(status); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  const copy = getOperationalCopy(locale).tasks.status;
  async function update(event: ChangeEvent<HTMLSelectElement>) { const nextStatus = event.target.value; const previous = value; setValue(nextStatus); setSaving(true); setMessage(""); try { const response = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: nextStatus }) }); const result = await response.json() as { ok: boolean; error?: { message: string } }; if (!response.ok || !result.ok) { setValue(previous); setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.error); return; } setMessage(copy.success); router.refresh(); } catch { setValue(previous); setMessage(copy.connectionError); } finally { setSaving(false); } }
  return <div className="task-status-control"><label><span className="sr-only">{copy.label}</span><select value={value} onChange={update} disabled={saving}><option value="todo">{copy.todo}</option><option value="in_progress">{copy.inProgress}</option><option value="done">{copy.done}</option></select></label>{message && <span className="sr-only" role="status">{message}</span>}</div>;
}
