import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { AppShell } from "../components/app-shell";
import { SettingsForm } from "../components/settings-form";
import { AvatarUploader } from "../components/avatar-uploader";
import { findWorkspaceByEmail, getUnreadNotificationCount } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configurações", description: "Preferências protegidas do Prismivo.", robots: { index: false, follow: false } };

export default async function SettingsPage() {
  const identity = await requireSessionUser("/app/configuracoes");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const unreadCount = await getUnreadNotificationCount(workspace.userId);

  return (
    <AppShell active="settings" title="Configurações" description="Perfil, empresa e preferências" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro compact-intro"><div><span className="eyebrow">SEU ESPAÇO, SUAS REGRAS</span><h1>Configurações claras e protegidas.</h1><p>As permissões são verificadas no servidor antes de qualquer alteração sensível.</p></div></section>
      <div className="settings-layout"><div className="settings-form"><section className="dashboard-panel settings-section"><AvatarUploader initialUrl={workspace.avatarUrl} name={workspace.userName} /></section><SettingsForm name={workspace.userName} email={workspace.userEmail} locale={workspace.userLocale} organizationName={workspace.organizationName} canEditOrganization={workspace.role === "owner" || workspace.role === "admin"} profile={{ bio: workspace.bio, jobTitle: workspace.jobTitle, phone: workspace.phone, location: workspace.location, website: workspace.website, accentColor: workspace.accentColor, interfaceFilter: workspace.interfaceFilter, colorVisionMode: workspace.colorVisionMode, organizationBrandColor: workspace.organizationBrandColor, organizationVisualStyle: workspace.organizationVisualStyle }} /></div><aside className="settings-aside"><article className="dashboard-panel"><ShieldCheck aria-hidden="true" /><h2>Proteção por organização</h2><p>O navegador nunca escolhe qual empresa será alterada. O servidor resolve a associação pela identidade autenticada.</p></article><article className="dashboard-panel"><LockKeyhole aria-hidden="true" /><h2>Sessão independente</h2><p>A conta usa Supabase Auth, cookies seguros e verificação de identidade no servidor.</p></article></aside></div>
    </AppShell>
  );
}
