"use client";

import { Archive, Eye, LoaderCircle, PencilLine } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

type Status = "draft" | "published" | "archived";

export function ContentStatusActions({ id, status, locale = "pt-BR" }: { id: string; status: Status; locale?: SiteLocale }) {
  const copy = getOperationalCopy(locale);
  const labels = copy.content.actions;
  const router = useRouter(); const [loading, setLoading] = useState<Status | null>(null); const [message, setMessage] = useState("");
  async function update(nextStatus: Status) { if (loading || nextStatus === status) return; setLoading(nextStatus); setMessage(""); try { const response = await fetch(`/api/content/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: nextStatus }) }); const result = await response.json() as { ok: boolean; error?: { message: string } }; if (!response.ok || !result.ok) { setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : labels.error); return; } router.refresh(); } catch { setMessage(copy.common.connectionError); } finally { setLoading(null); } }
  return <div className="content-status-actions">{status !== "published" && <button type="button" onClick={() => update("published")} disabled={Boolean(loading)}>{loading === "published" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Eye aria-hidden="true" />}{labels.publish}</button>}{status !== "draft" && <button type="button" onClick={() => update("draft")} disabled={Boolean(loading)}>{loading === "draft" ? <LoaderCircle className="spin" aria-hidden="true" /> : <PencilLine aria-hidden="true" />}{labels.draft}</button>}{status !== "archived" && <button type="button" onClick={() => update("archived")} disabled={Boolean(loading)}>{loading === "archived" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Archive aria-hidden="true" />}{labels.archive}</button>}{message && <small role="status">{message}</small>}</div>;
}
