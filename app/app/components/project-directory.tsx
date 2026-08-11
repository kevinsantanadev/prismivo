"use client";

import { FolderKanban, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProjectProgress } from "./project-progress";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";

type ProjectItem = {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  dueDate: string | null;
  isDemo: boolean;
  clientName: string | null;
};

export function ProjectDirectory({ projects, locale = "pt-BR" }: { projects: ProjectItem[]; locale?: SiteLocale }) {
  const copy = getOperationalCopy(locale);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => {
    const intlLocale = toIntlLocale(locale);
    const term = query.trim().toLocaleLowerCase(intlLocale);
    return projects.filter((project) => {
      const matchesStatus = status === "all" || project.status === status;
      const matchesTerm = !term || [project.name, project.clientName, project.description]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase(intlLocale).includes(term));
      return matchesStatus && matchesTerm;
    });
  }, [locale, projects, query, status]);

  return (
    <section className="dashboard-panel directory-panel" aria-labelledby="project-directory-title">
      <div className="directory-toolbar">
        <div><span className="panel-kicker">{copy.projects.execution}</span><h2 id="project-directory-title">{copy.projects.directoryTitle}</h2></div>
        <div className="directory-filters">
          <label className="app-search"><Search aria-hidden="true" /><span className="sr-only">{copy.projects.searchLabel}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.projects.searchPlaceholder} /></label>
          <label><span className="sr-only">{copy.projects.filterLabel}</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{copy.projects.all}</option><option value="active">{copy.projects.activePlural}</option><option value="completed">{copy.projects.completedPlural}</option></select></label>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><FolderKanban aria-hidden="true" /><h3>{projects.length ? copy.projects.noResult : copy.projects.noProjects}</h3><p>{projects.length ? copy.projects.adjust : copy.projects.createFirst}</p></div>
      ) : (
        <div className="responsive-table"><table><caption className="sr-only">{copy.projects.caption}</caption><thead><tr>{copy.projects.table.map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead><tbody>{filtered.map((project) => <tr key={project.id}><td><strong><Link href={`/app/projetos/${project.id}`}>{project.name}</Link></strong>{project.isDemo && <small className="demo-badge">{copy.projects.demo}</small>}<span>{project.description || copy.common.noDescription}</span></td><td>{project.clientName || copy.common.noClient}</td><td><ProjectProgress id={project.id} progress={project.progress} locale={locale} /></td><td>{formatDate(project.dueDate, locale, copy.projects.noDeadline)}</td><td><span className={`status-badge ${project.status}`}>{project.status === "completed" ? copy.projects.completed : copy.projects.active}</span></td></tr>)}</tbody></table></div>
      )}
    </section>
  );
}

function formatDate(value: string | null, locale: SiteLocale, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}
