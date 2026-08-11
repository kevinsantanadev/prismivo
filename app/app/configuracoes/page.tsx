import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { getRequestLocale } from "@/lib/site-locale-server";
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
  const [unreadCount, locale] = await Promise.all([
    getUnreadNotificationCount(workspace.userId),
    getRequestLocale(),
  ]);
  const copy = getOperationalCopy(locale);

  return (
    <AppShell active="settings" title="Configurações" description="Perfil, empresa e preferências" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro compact-intro"><div><span className="eyebrow">{copy.settingsPage.eyebrow}</span><h1>{copy.settingsPage.title}</h1><p>{copy.settingsPage.intro}</p></div></section>
      <div className="settings-layout"><div className="settings-form"><section className="dashboard-panel settings-section"><AvatarUploader initialUrl={workspace.avatarUrl} name={workspace.userName} locale={locale} /></section><SettingsForm requestLocale={locale} name={workspace.userName} email={workspace.userEmail} locale={workspace.userLocale} organizationName={workspace.organizationName} canEditOrganization={workspace.role === "owner" || workspace.role === "admin"} profile={{ bio: workspace.bio, jobTitle: workspace.jobTitle, phone: workspace.phone, location: workspace.location, website: workspace.website, accentColor: workspace.accentColor, interfaceFilter: workspace.interfaceFilter, colorVisionMode: workspace.colorVisionMode, organizationBrandColor: workspace.organizationBrandColor, organizationVisualStyle: workspace.organizationVisualStyle }} /></div><aside className="settings-aside"><article className="dashboard-panel"><ShieldCheck aria-hidden="true" /><h2>{copy.settingsPage.organizationProtection}</h2><p>{copy.settingsPage.organizationProtectionDetail}</p></article><article className="dashboard-panel"><LockKeyhole aria-hidden="true" /><h2>{copy.settingsPage.independentSession}</h2><p>{copy.settingsPage.independentSessionDetail}</p></article></aside></div>
    </AppShell>
  );
}
