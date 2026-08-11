"use client";

import { LoaderCircle, LockKeyhole, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

export function TicketStatusActions({ id, status, locale = "pt-BR" }: { id: string; status: string; locale?: SiteLocale }) {
  const copy = getOperationalCopy(locale);
  const labels = copy.support.status;
  const router = useRouter(); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState(""); const closed = status === "closed";
  async function changeStatus() { setSubmitting(true); setMessage(""); try { const response = await fetch(`/api/tickets/${id}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: closed ? "reopen" : "close" }) }); const result = await response.json() as { ok: boolean; error?: { message: string } }; if (!response.ok || !result.ok) { setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : labels.error); return; } router.refresh(); } catch { setMessage(copy.common.connectionError); } finally { setSubmitting(false); } }
  return <div className="ticket-status-action"><button className="app-secondary-button" type="button" onClick={changeStatus} disabled={submitting}>{submitting ? <LoaderCircle className="spin" aria-hidden="true" /> : closed ? <RotateCcw aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}{closed ? labels.reopen : labels.close}</button>{message && <small role="alert">{message}</small>}</div>;
}
