"use client";

import { CheckCheck, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function NotificationActions({ notificationId }: { notificationId?: string }) {
  const router = useRouter();
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
        setMessage(result.error?.message ?? "Não foi possível atualizar.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("A conexão falhou.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="notification-action-wrap">
      <button className={notificationId ? "text-action" : "app-secondary-button"} type="button" onClick={markRead} disabled={loading}>{loading ? <LoaderCircle className="spin" aria-hidden="true" /> : <CheckCheck aria-hidden="true" />}{notificationId ? "Marcar como lida" : "Marcar todas como lidas"}</button>
      {message && <small className="inline-error" role="status">{message}</small>}
    </span>
  );
}
