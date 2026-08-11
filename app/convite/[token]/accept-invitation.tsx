"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptInvitation({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function accept() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/team/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
    const result = await response.json() as { ok: boolean; error?: { message?: string } };
    if (!response.ok || !result.ok) { setBusy(false); setMessage(result.error?.message ?? "Não foi possível aceitar o convite."); return; }
    router.push("/app"); router.refresh();
  }
  return <div className="invite-accept-actions"><button className="primary-button" type="button" disabled={busy} onClick={accept}>{busy ? <><LoaderCircle className="spin" aria-hidden="true" />Validando…</> : <>Aceitar convite<ArrowRight aria-hidden="true" /></>}</button>{message && <p className="form-message" role="alert">{message}</p>}</div>;
}
