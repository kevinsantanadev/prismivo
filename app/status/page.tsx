import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, CheckCircle2, Database, Server } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status do serviço",
  description: "Disponibilidade atual dos serviços essenciais do Prismivo.",
  robots: { index: false, follow: true },
};

type ServiceState = "operational" | "degraded";

async function getServiceState(): Promise<{ application: ServiceState; database: ServiceState }> {
  if (!isSupabaseConfigured()) return { application: "operational", database: "degraded" };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("plans").select("code", { count: "exact", head: true }).eq("active", true);
    return { application: "operational", database: error ? "degraded" : "operational" };
  } catch {
    return { application: "operational", database: "degraded" };
  }
}

export default async function StatusPage() {
  const services = await getServiceState();
  const allOperational = Object.values(services).every((state) => state === "operational");
  const now = new Date();
  const checkedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(now);

  return <main className="status-page">
    <div className="status-page-glow" aria-hidden="true" />
    <header className="status-header">
      <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true"><span /></span><span>PRISMIVO</span></Link>
      <Link className="status-back" href="/"><ArrowLeft aria-hidden="true" />Voltar ao site</Link>
    </header>

    <section className="status-content" aria-labelledby="status-title">
      <span className="eyebrow">DISPONIBILIDADE DO SERVIÇO</span>
      <div className={`status-overview ${allOperational ? "operational" : "degraded"}`}>
        {allOperational ? <CheckCircle2 aria-hidden="true" /> : <Activity aria-hidden="true" />}
        <div>
          <h1 id="status-title">{allOperational ? "Todos os sistemas operacionais." : "Alguns serviços estão degradados."}</h1>
          <p>{allOperational ? "O Prismivo está funcionando normalmente." : "A aplicação está disponível, mas uma dependência requer atenção."}</p>
        </div>
      </div>

      <div className="status-services" aria-label="Estado dos serviços essenciais">
        <ServiceStatus icon={<Server aria-hidden="true" />} name="Aplicação web" state={services.application} />
        <ServiceStatus icon={<Database aria-hidden="true" />} name="Dados e autenticação" state={services.database} />
      </div>

      <p className="status-timestamp">Última verificação: <time dateTime={now.toISOString()}>{checkedAt}</time></p>
    </section>
  </main>;
}

function ServiceStatus({ icon, name, state }: { icon: ReactNode; name: string; state: ServiceState }) {
  return <article>
    <span className="status-service-icon">{icon}</span>
    <strong>{name}</strong>
    <span className={`status-pill ${state}`}>{state === "operational" ? "Operacional" : "Instabilidade"}</span>
  </article>;
}
