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
  Newspaper,
  Palette,
  ReceiptText,
  ShieldCheck,
  Settings2,
  UserRoundCog,
  Users,
} from "lucide-react";
import { signOutPath } from "@/app/session-auth";
import {
  appShellCopy,
  translateAppShellText,
  type AppSection,
} from "@/lib/app-shell-i18n";
import { getRequestLocale } from "@/lib/site-locale-server";
import { MobileAppNavigation } from "./mobile-app-navigation";
import { WorkspacePreferencesSync } from "./workspace-preferences-sync";

type WorkspaceSummary = {
  organizationName: string;
  userName: string;
  role?: string;
  avatarUrl?: string | null;
  userLocale: string;
  theme: string;
  accentColor: string;
  interfaceFilter: string;
  colorVisionMode: string;
};

const navItems = [
  ["dashboard", "/app", LayoutDashboard],
  ["tasks", "/app/tarefas", ListChecks],
  ["projects", "/app/projetos", FolderKanban],
  ["clients", "/app/clientes", Users],
  ["approvals", "/app/aprovacoes", FileCheck2],
  ["files", "/app/arquivos", Files],
  ["support", "/app/atendimento", Headphones],
  ["content", "/app/conteudo", Newspaper],
  ["billing", "/app/assinatura", ReceiptText],
  ["notifications", "/app/notificacoes", Bell],
  ["team", "/app/equipe", UserRoundCog],
  ["admin", "/app/administracao", ShieldCheck],
  ["settings", "/app/configuracoes", Settings2],
] as const;

/** Shared authenticated chrome keeps every operational screen predictable. */
export async function AppShell({
  active,
  title,
  description,
  workspace,
  unreadCount,
  children,
}: {
  active: AppSection;
  title: string;
  description: string;
  workspace: WorkspaceSummary;
  unreadCount: number;
  children: ReactNode;
}) {
  const locale = await getRequestLocale();
  const copy = appShellCopy[locale];
  const localizedTitle = translateAppShellText(title, locale);
  const localizedDescription = translateAppShellText(description, locale);
  const initials = workspace.userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const visibleNavItems = navItems.filter(([key]) => isNavigationVisible(key, workspace.role));

  return (
    <div className="app-layout">
      <WorkspacePreferencesSync
        locale={workspace.userLocale}
        theme={workspace.theme}
        accentColor={workspace.accentColor}
        interfaceFilter={workspace.interfaceFilter}
        colorVisionMode={workspace.colorVisionMode}
      />
      <a className="skip-link" href="#app-content">{copy.skip}</a>
      <aside className="app-sidebar">
        <Link className="brand app-brand" href="/" aria-label={copy.homeLabel}>
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>PRISMIVO</span>
        </Link>
        <div className="workspace-switcher">
          <span><Building2 aria-hidden="true" /></span>
          <div><small>{copy.company}</small><strong>{workspace.organizationName}</strong></div>
        </div>
        <nav aria-label={copy.navigation}>
          {visibleNavItems.map(([key, href, Icon]) => (
            <Link
              key={key}
              href={href}
              className={active === key ? "active" : ""}
              aria-current={active === key ? "page" : undefined}
            >
              <Icon aria-hidden="true" />{copy.nav[key]}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href={signOutPath("/")}><LogOut aria-hidden="true" />{copy.logout}</a>
        </div>
      </aside>

      <div className="app-workspace">
        <header className="app-topbar">
          <div><span className="app-breadcrumb">{localizedTitle}</span><small>{localizedDescription}</small></div>
          <div className="app-top-actions">
            <Link
              href="/app/configuracoes#appearance-settings-title"
              className="notification-button app-appearance-button"
              aria-label={copy.appearance}
              title={copy.appearance}
            >
              <Palette aria-hidden="true" />
            </Link>
            <Link
              href="/app/notificacoes"
              className="notification-button"
              aria-label={copy.unread(unreadCount)}
            >
              <Bell aria-hidden="true" />
              {unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </Link>
            <Link
              href="/app/configuracoes"
              className="user-avatar"
              title={copy.settingsFor(workspace.userName)}
              aria-label={copy.openProfile}
            >
              {workspace.avatarUrl ? <span className="user-avatar-image" style={{ backgroundImage: `url(${workspace.avatarUrl})` }} aria-hidden="true" /> : initials}
            </Link>
          </div>
        </header>
        <main id="app-content" className="app-content">{children}</main>
      </div>
      <MobileAppNavigation
        active={active}
        copy={copy}
        items={visibleNavItems.map(([key, href]) => ({ key, href }))}
      />
    </div>
  );
}

function isNavigationVisible(key: AppSection, role?: string) {
  if (["team", "admin", "billing"].includes(key)) return role === "owner" || role === "admin";
  if (key === "content") return role === "owner" || role === "admin" || role === "editor";
  return true;
}
