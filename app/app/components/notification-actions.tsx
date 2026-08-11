"use client";

import { CheckCheck, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

export function NotificationActions({ notificationId, locale = "pt-BR" }: { notificationId?: string; locale?: SiteLocale }) {
  const router = useRouter();
  const copy = getOperationalCopy(locale).notifications;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function markRead() {
    if (loading) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(notificationId ? { notificationId } : { markAll: true }),
      });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) {
        setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.updateError);
        return;
      }
      router.refresh();
    } catch {
      setMessage(copy.connectionError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="notification-action-wrap">
      <button className={notificationId ? "text-action" : "app-secondary-button"} type="button" onClick={markRead} disabled={loading}>{loading ? <LoaderCircle className="spin" aria-hidden="true" /> : <CheckCheck aria-hidden="true" />}{notificationId ? copy.markOne : copy.markAll}</button>
      {message && <small className="inline-error" role="status">{message}</small>}
    </span>
  );
}
