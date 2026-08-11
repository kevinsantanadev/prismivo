import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return <main className="system-page">
    <div className="system-page-code" aria-hidden="true">404</div>
    <Compass aria-hidden="true" />
    <span className="eyebrow">ROTA NÃO ENCONTRADA</span>
    <h1>Este caminho mudou de ângulo.</h1>
    <p>A página pode ter sido movida ou o endereço está incompleto. Volte ao início para retomar a navegação.</p>
    <Link className="button button-primary" href="/"><ArrowLeft aria-hidden="true" />Voltar ao Prismivo</Link>
  </main>;
}
