import type { Metadata } from "next";
import Link from "next/link";
import { Activity, RotateCcw } from "lucide-react";

export const metadata: Metadata = { title: "Manutenção programada", description: "Página de manutenção do Prismivo.", robots: { index: false, follow: false } };

export default function MaintenancePage() {
  return <main className="system-page">
    <div className="system-page-code" aria-hidden="true">STATUS</div>
    <Activity aria-hidden="true" />
    <span className="eyebrow">MANUTENÇÃO PROGRAMADA</span>
    <h1>Ajustando cada face da operação.</h1>
    <p>Esta página está preparada para janelas controladas de manutenção. O acesso normal pode ser retomado assim que a atualização for concluída.</p>
    <Link className="button button-primary" href="/"><RotateCcw aria-hidden="true" />Verificar novamente</Link>
  </main>;
}
