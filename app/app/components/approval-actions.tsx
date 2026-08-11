"use client";

import { Check, LoaderCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApprovalActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approved" | "changes_requested" | null>(null);
  const [message, setMessage] = useState("");

  async function decide(decision: "approved" | "changes_requested") {
    if (loading) return;
    setLoading(decision);
    setMessage("");
    try {
      const response = await fetch(`/api/approvals/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) {
        setMessage(result.error?.message ?? "Não foi possível registrar a decisão.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("A conexão falhou. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="approval-actions">
      <button type="button" className="decision-button approve" onClick={() => decide("approved")} disabled={Boolean(loading)}>{loading === "approved" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Check aria-hidden="true" />}Aprovar</button>
      <button type="button" className="decision-button changes" onClick={() => decide("changes_requested")} disabled={Boolean(loading)}>{loading === "changes_requested" ? <LoaderCircle className="spin" aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}Pedir ajustes</button>
      {message && <small className="inline-error" role="status">{message}</small>}
    </div>
  );
}
