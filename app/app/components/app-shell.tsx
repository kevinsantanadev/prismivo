import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  FileCheck2,
  Files,
  FolderKanban,
  Headphones,
  LayoutDashboard,
  ListChecks,
  LogOut,
  ShieldCheck,
  Settings2,
  UserRoundCog,
  Users,
} from "lucide-react";
import { signOutPath } from "@/app/session-auth";
import { PreferencesMenu } from "@/app/components/preferences-menu";

type ActiveSection =
  | "dashboard"
  | "tasks"
  | "projects"
  | "clients"
  | "approvals"
  | "files"
  | "support"
  | "notifications"
  | "team"
  | "admin"
  | "settings";

type WorkspaceSummary = {
  organizationName: string;
  userName: string;
  role?: string;
  avatarUrl?: string | null;
};

const navItems = [
  ["dashboard", "Visão geral", "/app", LayoutDashboard],
  ["tasks", "Tarefas", "/app/tarefas", ListChecks],
  ["projects", "Projetos", "/app/projetos", FolderKanban],
  ["clients", "Clientes", "/app/clientes", Users],
  ["approvals", "Aprovações", "/app/aprovacoes", FileCheck2],
  ["files", "Arquivos", "/app/arquivos", Files],
  ["support", "Atendimento", "/app/atendimento", Headphones],
  ["notifications", "Notificações", "/app/notificacoes", Bell],
  ["team", "Equipe", "/app/equipe", UserRoundCog],
  ["admin", "Administração", "/app/administracao", ShieldCheck],
  ["settings", "Configurações", "/app/configuracoes", Settings2],
] as const;

/** Shared authenticated chrome keeps every operational screen predictable. */
export function AppShell({
  active,
  title,
  description,
  workspace,
  unreadCount,
  children,
}: {
  active: ActiveSection;
  title: string;
  description: string;
  workspace: WorkspaceSummary;
  unreadCount: number;
  children: ReactNode;
}) {
  const initials = workspace.userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="app-layout">
      <a className="skip-link" href="#app-content">Pular para o conteúdo</a>
      <aside className="app-sidebar">
        <Link className="brand app-brand" href="/" aria-label="Prismivo — página inicial">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>PRISMIVO</span>
        </Link>
        <div className="workspace-switcher">
          <span><Building2 aria-hidden="true" /></span>
          <div><small>Empresa</small><strong>{workspace.organizationName}</strong></div>
        </div>
        <nav aria-label="Navegação do espaço">
          {navItems.filter(([key]) => !["team", "admin"].includes(key) || workspace.role === "owner" || workspace.role === "admin").map(([key, label, href, Icon]) => (
            <Link
              key={key}
              href={href}
              className={active === key ? "active" : ""}
              aria-current={active === key ? "page" : undefined}
            >
              <Icon aria-hidden="true" />{label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href={signOutPath("/")}><LogOut aria-hidden="true" />Sair</a>
        </div>
      </aside>

      <div className="app-workspace">
        <header className="app-topbar">
          <div><span className="app-breadcrumb">{title}</span><small>{description}</small></div>
          <div className="app-top-actions">
            <PreferencesMenu />
            <Link
              href="/app/notificacoes"
              className="notification-button"
              aria-label={`${unreadCount} notificações não lidas`}
            >
              <Bell aria-hidden="true" />
              {unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </Link>
            <Link
              href="/app/configuracoes"
              className="user-avatar"
              title={`Configurações de ${workspace.userName}`}
              aria-label="Abrir configurações do perfil"
            >
              {workspace.avatarUrl ? <span className="user-avatar-image" style={{ backgroundImage: `url(${workspace.avatarUrl})` }} aria-hidden="true" /> : initials}
            </Link>
          </div>
        </header>
        <main id="app-content" className="app-content">{children}</main>
      </div>
    </div>
  );
}
