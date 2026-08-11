"use client";

import { Camera, LoaderCircle, Trash2, Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function AvatarUploader({ initialUrl, name }: { initialUrl: string | null; name: string }) {
  const router = useRouter();
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
    if (!response.ok || !result.ok || !result.data?.url) return setMessage(result.error?.message ?? "Não foi possível enviar a foto.");
    setUrl(result.data.url); setMessage("Foto atualizada."); router.refresh();
  }

  async function remove() {
    if (!url || busy) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/profile/avatar", { method: "DELETE" });
    const result = await response.json() as { ok: boolean; error?: { message?: string } };
    setBusy(false);
    if (!response.ok || !result.ok) return setMessage(result.error?.message ?? "Não foi possível remover a foto.");
    setUrl(null); setMessage("Foto removida."); router.refresh();
  }

  return <div className="avatar-uploader"><div className="profile-avatar-preview">{url ? <span style={{ backgroundImage: `url(${url})` }} role="img" aria-label={`Foto de ${name}`} /> : <strong>{initials}</strong>}<Camera aria-hidden="true" /></div><div><h3>Foto do perfil</h3><p>JPG, PNG ou WebP, até 2 MB. O arquivo fica em armazenamento privado.</p><div className="avatar-actions"><input ref={inputRef} className="sr-only" id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /><button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}Escolher foto</button>{url && <button className="text-danger-button" type="button" onClick={remove} disabled={busy}><Trash2 aria-hidden="true" />Remover</button>}</div>{message && <small role="status">{message}</small>}</div></div>;
}
