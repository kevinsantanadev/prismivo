"use client";

import { Archive, LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

type ApiResult = { ok: boolean; error?: { message?: string } };

export function ProjectLifecycleActions({
  id,
  name,
  status,
  canDelete,
  locale = "pt-BR",
  redirectAfterDelete = false,
}: {
  id: string;
  name: string;
  status: string;
  canDelete: boolean;
  locale?: SiteLocale;
  redirectAfterDelete?: boolean;
}) {
  const router = useRouter();
  const copy = getOperationalCopy(locale).projects.lifecycle;
  const [busy, setBusy] = useState<"archive" | "restore" | "delete" | "">("");
  const [message, setMessage] = useState("");
  const archived = status === "archived";

  async function changeLifecycle(action: "archive" | "restore") {
    if (busy || (action === "archive" && !window.confirm(copy.archiveConfirm(name)))) return;
    setBusy(action);
    setMessage("");
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json() as ApiResult;
      if (!response.ok || !result.ok) {
        setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.error);
        return;
      }
      setMessage(action === "archive" ? copy.archiveSuccess : copy.restoreSuccess);
      router.refresh();
    } catch {
      setMessage(copy.connectionError);
    } finally {
      setBusy("");
    }
  }

  async function deleteProject() {
    if (busy || !window.confirm(copy.deleteConfirm(name))) return;
    setBusy("delete");
    setMessage("");
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json() as ApiResult;
      if (!response.ok || !result.ok) {
        setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.error);
        return;
      }
      if (redirectAfterDelete) {
        router.replace("/app/projetos");
      } else {
        setMessage(copy.deleteSuccess);
        router.refresh();
      }
    } catch {
      setMessage(copy.connectionError);
    } finally {
      setBusy("");
    }
  }

  return <div className="project-lifecycle-actions">
    <div className="project-lifecycle-buttons">
      {archived ? <button className="app-secondary-button" type="button" disabled={Boolean(busy)} onClick={() => changeLifecycle("restore")}>{busy === "restore" ? <LoaderCircle className="spin" aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}{copy.restore}</button> : <button className="app-secondary-button" type="button" disabled={Boolean(busy)} onClick={() => changeLifecycle("archive")}>{busy === "archive" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Archive aria-hidden="true" />}{copy.archive}</button>}
      {archived && canDelete && <button className="text-danger-button" type="button" disabled={Boolean(busy)} onClick={deleteProject}>{busy === "delete" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}{copy.delete}</button>}
    </div>
    {message && <small className="project-lifecycle-message" role="status">{message}</small>}
  </div>;
}
