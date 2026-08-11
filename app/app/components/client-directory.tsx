"use client";

import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";

type ClientItem = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string;
  isDemo: boolean;
  projectCount: number;
};

export function ClientDirectory({ clients, locale = "pt-BR" }: { clients: ClientItem[]; locale?: SiteLocale }) {
  const copy = getOperationalCopy(locale).clients;
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const intlLocale = toIntlLocale(locale);
    const term = query.trim().toLocaleLowerCase(intlLocale);
    if (!term) return clients;
    return clients.filter((client) =>
      [client.name, client.company, client.email]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase(intlLocale).includes(term)),
    );
  }, [clients, locale, query]);

  return (
    <section className="dashboard-panel directory-panel" aria-labelledby="client-directory-title">
      <div className="directory-toolbar">
        <div><span className="panel-kicker">{copy.portfolio}</span><h2 id="client-directory-title">{copy.directoryTitle}</h2></div>
        <label className="app-search"><Search aria-hidden="true" /><span className="sr-only">{copy.searchLabel}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} /></label>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><Users aria-hidden="true" /><h3>{clients.length ? copy.noResult : copy.noClients}</h3><p>{clients.length ? copy.changeSearch : copy.addFirst}</p></div>
      ) : (
        <div className="entity-grid">
          {filtered.map((client) => (
            <article className="entity-card" key={client.id}>
              <div className="entity-avatar" aria-hidden="true">{client.name.slice(0, 2).toUpperCase()}</div>
              <div className="entity-card-main"><span>{client.company || copy.independent}</span><h3><Link href={`/app/clientes/${client.id}`}>{client.name}</Link></h3><p>{client.email || copy.missingEmail}</p></div>
              <div className="entity-card-footer"><span className={`status-badge ${client.status}`}>{client.status === "active" ? copy.active : client.status}</span><small>{Number(client.projectCount)} {Number(client.projectCount) === 1 ? copy.projectSingular : copy.projectPlural}</small>{client.isDemo && <small className="demo-badge">{copy.demo}</small>}<Link className="entity-link" href={`/app/clientes/${client.id}`}>{copy.details}</Link></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
