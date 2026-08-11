"use client";

import { Archive, Eye, LoaderCircle, PencilLine } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "draft" | "published" | "archived";

export function ContentStatusActions({ id, status }: { id: string; status: Status }) {
  const router = useRouter();
  const [loading, setLoading] = useState<Status | null>(null);
  const [message, setMessage] = useState("");

  async function update(nextStatus: Status) {
    if (loading || nextStatus === status) return;
    setLoading(nextStatus);
    setMessage("");
    try {
      const response = await fetch(`/api/content/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
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
      setLoading(null);
    }
  }

  return <div className="content-status-actions">
    {status !== "published" && <button type="button" onClick={() => update("published")} disabled={Boolean(loading)}>{loading === "published" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Eye aria-hidden="true" />}Publicar</button>}
    {status !== "draft" && <button type="button" onClick={() => update("draft")} disabled={Boolean(loading)}>{loading === "draft" ? <LoaderCircle className="spin" aria-hidden="true" /> : <PencilLine aria-hidden="true" />}Rascunho</button>}
    {status !== "archived" && <button type="button" onClick={() => update("archived")} disabled={Boolean(loading)}>{loading === "archived" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Archive aria-hidden="true" />}Arquivar</button>}
    {message && <small role="status">{message}</small>}
  </div>;
}
