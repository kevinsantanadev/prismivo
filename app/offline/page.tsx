import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw, WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Sem conexão", description: "O Prismivo está aguardando sua conexão ser restabelecida.", robots: { index: false, follow: false } };

export default function OfflinePage() {
  return <main className="offline-page">
    <div className="offline-mark" aria-hidden="true"><WifiOff /></div>
    <span className="eyebrow">CONEXÃO INTERROMPIDA</span>
    <h1>Seu trabalho continua protegido.</h1>
    <p>Não armazenamos dados privados da sua conta no cache offline. Reconecte-se para acessar a operação com segurança.</p>
    <Link className="button button-primary" href="/"><RefreshCw aria-hidden="true" />Tentar novamente</Link>
  </main>;
}
