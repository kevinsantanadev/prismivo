"use client";

import { LoaderCircle } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ProjectProgress({ id, progress }: { id: string; progress: number }) {
  const router = useRouter();
  const [value, setValue] = useState(progress);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function update(event: ChangeEvent<HTMLSelectElement>) {
    const nextValue = Number(event.target.value);
    const previousValue = value;
    setValue(nextValue);
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(id)}/progress`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ progress: nextValue }),
      });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) {
        setValue(previousValue);
        setMessage(result.error?.message ?? "Falha ao atualizar.");
        return;
      }
      router.refresh();
    } catch {
      setValue(previousValue);
      setMessage("Sem conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="progress-control">
      <label className="sr-only" htmlFor={`progress-${id}`}>Progresso do projeto</label>
      <select id={`progress-${id}`} value={value} onChange={update} disabled={loading}>
        {[0, 25, 50, 75, 100].map((option) => <option key={option} value={option}>{option}%</option>)}
      </select>
      {loading && <LoaderCircle className="spin" aria-label="Salvando progresso" />}
      {message && <small className="inline-error" role="status">{message}</small>}
    </div>
  );
}
