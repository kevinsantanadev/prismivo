"use client";

import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type ClientItem = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string;
  isDemo: boolean;
  projectCount: number;
};

export function ClientDirectory({ clients }: { clients: ClientItem[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return clients;
    return clients.filter((client) =>
      [client.name, client.company, client.email]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("pt-BR").includes(term)),
    );
  }, [clients, query]);

  return (
    <section className="dashboard-panel directory-panel" aria-labelledby="client-directory-title">
      <div className="directory-toolbar">
        <div><span className="panel-kicker">CARTEIRA ATIVA</span><h2 id="client-directory-title">Clientes</h2></div>
        <label className="app-search"><Search aria-hidden="true" /><span className="sr-only">Pesquisar clientes</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, empresa ou e-mail" /></label>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><Users aria-hidden="true" /><h3>{clients.length ? "Nenhum resultado" : "Nenhum cliente ainda"}</h3><p>{clients.length ? "Tente outro termo de pesquisa." : "Adicione seu primeiro cliente para começar."}</p></div>
      ) : (
        <div className="entity-grid">
          {filtered.map((client) => (
            <article className="entity-card" key={client.id}>
              <div className="entity-avatar" aria-hidden="true">{client.name.slice(0, 2).toUpperCase()}</div>
              <div className="entity-card-main"><span>{client.company || "Cliente independente"}</span><h3><Link href={`/app/clientes/${client.id}`}>{client.name}</Link></h3><p>{client.email || "E-mail ainda não informado"}</p></div>
              <div className="entity-card-footer"><span className={`status-badge ${client.status}`}>{client.status === "active" ? "Ativo" : client.status}</span><small>{Number(client.projectCount)} {Number(client.projectCount) === 1 ? "projeto" : "projetos"}</small>{client.isDemo && <small className="demo-badge">Demonstração</small>}<Link className="entity-link" href={`/app/clientes/${client.id}`}>Ver detalhes</Link></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
