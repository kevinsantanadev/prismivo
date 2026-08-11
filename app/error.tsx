"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("page_render_failed", { name: error.name, digest: error.digest });
  }, [error]);

  return <main className="system-page">
    <div className="system-page-code" aria-hidden="true">500</div>
    <TriangleAlert aria-hidden="true" />
    <span className="eyebrow">FALHA TEMPORÁRIA</span>
    <h1>A operação encontrou um desvio.</h1>
    <p>Nenhum dado precisa ser reenviado agora. Tente reconstruir esta tela; se a falha continuar, retorne em alguns instantes.</p>
    <button className="button button-primary" type="button" onClick={reset}><RefreshCw aria-hidden="true" />Tentar novamente</button>
  </main>;
}
