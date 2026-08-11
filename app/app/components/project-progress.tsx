"use client";

import { LoaderCircle } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

export function ProjectProgress({ id, progress, locale = "pt-BR" }: { id: string; progress: number; locale?: SiteLocale }) {
  const router = useRouter();
  const copy = getOperationalCopy(locale).projects.progress;
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
        setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.error);
        return;
      }
      router.refresh();
    } catch {
      setValue(previousValue);
      setMessage(copy.offline);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="progress-control">
      <label className="sr-only" htmlFor={`progress-${id}`}>{copy.label}</label>
      <select id={`progress-${id}`} value={value} onChange={update} disabled={loading}>
        {[0, 25, 50, 75, 100].map((option) => <option key={option} value={option}>{option}%</option>)}
      </select>
      {loading && <LoaderCircle className="spin" aria-label={copy.saving} />}
      {message && <small className="inline-error" role="status">{message}</small>}
    </div>
  );
}
