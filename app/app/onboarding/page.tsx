import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/app/session-auth";
import { getManagementCopy } from "@/lib/app-management-i18n";
import { getRequestLocale } from "@/lib/site-locale-server";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configurar empresa",
  description: "Crie o espaço gratuito da sua empresa no Prismivo.",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const locale = await getRequestLocale();
  const copy = getManagementCopy(locale).onboarding;
  const identity = await requireSessionUser("/app/onboarding");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (workspace) redirect("/app");

  return (
    <div className="onboarding-page">
      <header className="access-header"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true"><span /></span><span>PRISMIVO</span></Link><span>{copy.step}</span></header>
      <main className="onboarding-layout">
        <section className="onboarding-copy"><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p><div className="onboarding-plan"><span><Building2Icon /></span><div><strong>{copy.plan}</strong><p>{copy.planDetail}</p></div></div></section>
        <section className="onboarding-card" aria-label={copy.cardAria}><h2>{copy.operationData}</h2><p>{copy.time}</p><OnboardingForm locale={locale} name={identity.displayName} email={identity.email} /></section>
      </main>
    </div>
  );
}

function Building2Icon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M9 21v-2h2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
