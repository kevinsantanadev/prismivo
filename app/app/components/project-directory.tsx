"use client";

import { FolderKanban, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProjectProgress } from "./project-progress";

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

export function ProjectDirectory({ projects }: { projects: ProjectItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return projects.filter((project) => {
      const matchesStatus = status === "all" || project.status === status;
      const matchesTerm = !term || [project.name, project.clientName, project.description]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("pt-BR").includes(term));
      return matchesStatus && matchesTerm;
    });
  }, [projects, query, status]);

  return (
    <section className="dashboard-panel directory-panel" aria-labelledby="project-directory-title">
      <div className="directory-toolbar">
        <div><span className="panel-kicker">EXECUÇÃO</span><h2 id="project-directory-title">Projetos</h2></div>
        <div className="directory-filters">
          <label className="app-search"><Search aria-hidden="true" /><span className="sr-only">Pesquisar projetos</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar projeto ou cliente" /></label>
          <label><span className="sr-only">Filtrar por status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option><option value="active">Ativos</option><option value="completed">Concluídos</option></select></label>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><FolderKanban aria-hidden="true" /><h3>{projects.length ? "Nenhum resultado" : "Nenhum projeto ainda"}</h3><p>{projects.length ? "Ajuste a busca ou o filtro." : "Crie seu primeiro projeto para organizar a execução."}</p></div>
      ) : (
        <div className="responsive-table"><table><caption className="sr-only">Projetos da empresa</caption><thead><tr><th scope="col">Projeto</th><th scope="col">Cliente</th><th scope="col">Progresso</th><th scope="col">Prazo</th><th scope="col">Status</th></tr></thead><tbody>{filtered.map((project) => <tr key={project.id}><td><strong><Link href={`/app/projetos/${project.id}`}>{project.name}</Link></strong>{project.isDemo && <small className="demo-badge">Demonstração</small>}<span>{project.description || "Sem descrição"}</span></td><td>{project.clientName || "Sem cliente"}</td><td><ProjectProgress id={project.id} progress={project.progress} /></td><td>{formatDate(project.dueDate)}</td><td><span className={`status-badge ${project.status}`}>{project.status === "completed" ? "Concluído" : "Ativo"}</span></td></tr>)}</tbody></table></div>
      )}
    </section>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}
