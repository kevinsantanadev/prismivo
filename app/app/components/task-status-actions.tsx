"use client";
import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
export function TaskStatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter(); const [value, setValue] = useState(status); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  async function update(event: ChangeEvent<HTMLSelectElement>) { const nextStatus = event.target.value; const previous = value; setValue(nextStatus); setSaving(true); setMessage(""); try { const response = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: nextStatus }) }); const result = await response.json() as { ok: boolean; error?: { message: string } }; if (!response.ok || !result.ok) { setValue(previous); setMessage(result.error?.message ?? "Falha ao atualizar."); return; } setMessage("Status atualizado."); router.refresh(); } catch { setValue(previous); setMessage("A conexão falhou."); } finally { setSaving(false); } }
  return <div className="task-status-control"><label><span className="sr-only">Status da tarefa</span><select value={value} onChange={update} disabled={saving}><option value="todo">A fazer</option><option value="in_progress">Em andamento</option><option value="done">Concluída</option></select></label>{message && <span className="sr-only" role="status">{message}</span>}</div>;
}
