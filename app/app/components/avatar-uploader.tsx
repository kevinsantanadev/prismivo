"use client";

import { Camera, LoaderCircle, Trash2, Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

export function AvatarUploader({ initialUrl, name, locale = "pt-BR" }: { initialUrl: string | null; name: string; locale?: SiteLocale }) {
  const router = useRouter();
  const copy = getOperationalCopy(locale).avatar;
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || busy) return;
    setBusy(true); setMessage("");
    const formData = new FormData(); formData.set("avatar", file);
    const response = await fetch("/api/profile/avatar", { method: "POST", body: formData });
    const result = await response.json() as { ok: boolean; data?: { url?: string }; error?: { message?: string } };
    setBusy(false); event.target.value = "";
    if (!response.ok || !result.ok || !result.data?.url) return setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.uploadError);
    setUrl(result.data.url); setMessage(copy.uploadSuccess); router.refresh();
  }

  async function remove() {
    if (!url || busy) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/profile/avatar", { method: "DELETE" });
    const result = await response.json() as { ok: boolean; error?: { message?: string } };
    setBusy(false);
    if (!response.ok || !result.ok) return setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.removeError);
    setUrl(null); setMessage(copy.removeSuccess); router.refresh();
  }

  return <div className="avatar-uploader"><div className="profile-avatar-preview">{url ? <span style={{ backgroundImage: `url(${url})` }} role="img" aria-label={copy.imageOf(name)} /> : <strong>{initials}</strong>}<Camera aria-hidden="true" /></div><div><h3>{copy.title}</h3><p>{copy.detail}</p><div className="avatar-actions"><input ref={inputRef} className="sr-only" id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /><button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}{copy.choose}</button>{url && <button className="text-danger-button" type="button" onClick={remove} disabled={busy}><Trash2 aria-hidden="true" />{copy.remove}</button>}</div>{message && <small role="status">{message}</small>}</div></div>;
}
