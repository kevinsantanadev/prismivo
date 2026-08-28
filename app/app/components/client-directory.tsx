"use client";

import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { getMarco23Copy } from "@/lib/marco23-i18n";
import type { ClientInsight } from "@/lib/marco23";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";

type ClientItem = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string;
  isDemo: boolean;
  projectCount: number;
  insight: ClientInsight;
};

export function ClientDirectory({ clients, locale = "pt-BR" }: { clients: ClientItem[]; locale?: SiteLocale }) {
  const copy = getOperationalCopy(locale).clients;
  const crm = getMarco23Copy(locale).crm;
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<ClientInsight["health"] | "all">("all");
  const filtered = useMemo(() => {
    const intlLocale = toIntlLocale(locale);
    const term = query.trim().toLocaleLowerCase(intlLocale);
    return clients.filter((client) => {
      if (health !== "all" && client.insight.health !== health) return false;
      if (!term) return true;
      return [client.name, client.company, client.email]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase(intlLocale).includes(term));
    });
  }, [clients, health, locale, query]);

  return (
    <section className="dashboard-panel directory-panel" aria-labelledby="client-directory-title">
      <div className="directory-toolbar">
        <div><span className="panel-kicker">{copy.portfolio}</span><h2 id="client-directory-title">{copy.directoryTitle}</h2></div>
        <div className="directory-filters"><label className="app-search"><Search aria-hidden="true" /><span className="sr-only">{copy.searchLabel}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} /></label><label className="crm-health-filter"><span className="sr-only">{crm.portfolioHealth}</span><select value={health} onChange={(event) => setHealth(event.target.value as ClientInsight["health"] | "all")}><option value="all">{crm.portfolioHealth}</option><option value="healthy">{crm.healthy}</option><option value="attention">{crm.attention}</option><option value="inactive">{crm.inactive}</option></select></label></div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><Users aria-hidden="true" /><h3>{clients.length ? copy.noResult : copy.noClients}</h3><p>{clients.length ? copy.changeSearch : copy.addFirst}</p></div>
      ) : (
        <div className="entity-grid">
          {filtered.map((client) => (
            <article className="entity-card" key={client.id}>
              <div className="entity-avatar" aria-hidden="true">{client.name.slice(0, 2).toUpperCase()}</div>
              <div className="entity-card-main"><span>{client.company || copy.independent}</span><h3><Link href={`/app/clientes/${client.id}`}>{client.name}</Link></h3><p>{client.email || copy.missingEmail}</p></div>
              <div className="crm-card-signal"><span className={`crm-health ${client.insight.health}`}>{crm[client.insight.health]}</span><small>{client.insight.averageProgress}% {crm.averageProgress}</small></div>
              <div className="entity-card-footer"><span className={`status-badge ${client.status}`}>{client.status === "active" ? copy.active : client.status}</span><small>{client.insight.activeProjects} {crm.activeProjects}</small>{client.insight.overdueProjects > 0 && <small className="crm-overdue">{client.insight.overdueProjects} {crm.overdue}</small>}{client.isDemo && <small className="demo-badge">{copy.demo}</small>}<Link className="entity-link" href={`/app/clientes/${client.id}`}>{copy.details}</Link></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
