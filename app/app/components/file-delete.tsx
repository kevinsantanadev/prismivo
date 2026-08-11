"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

export function FileDelete({ id, name, locale = "pt-BR" }: { id: string; name: string; locale?: SiteLocale }) {
  const router = useRouter();
  const copy = getOperationalCopy(locale);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function remove() {
    if (!window.confirm(copy.files.remove.confirm(name))) return;
    setDeleting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/files/${id}`, { method: "DELETE" });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) {
        setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.files.remove.error);
        return;
      }
      router.refresh();
    } catch {
      setMessage(copy.notifications.connectionError);
    } finally {
      setDeleting(false);
    }
  }

  return <span className="file-delete-control"><button type="button" onClick={remove} disabled={deleting} aria-label={copy.files.remove.label(name)}>{deleting ? <LoaderCircle className="spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}</button>{message && <small role="alert">{message}</small>}</span>;
}
