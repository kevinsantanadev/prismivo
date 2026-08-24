"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error("page_render_failed", { name: error.name, digest: error.digest });
  }, [error]);

  return <main className="system-page">
    <div className="system-page-code" aria-hidden="true">500</div>
    <TriangleAlert aria-hidden="true" />
    <span className="eyebrow">FALHA TEMPORÁRIA</span>
    <h1>A operação encontrou um desvio.</h1>
    <p>Nenhum dado precisa ser reenviado. Atualize a página para reconstruir a interface com a versão mais recente.</p>
    <button className="button button-primary" type="button" onClick={() => window.location.reload()}><RefreshCw aria-hidden="true" />Atualizar página</button>
  </main>;
}
