import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getSessionUser, signInPath } from "@/app/session-auth";
import { AcceptInvitation } from "./accept-invitation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Convite de equipe", description: "Aceite protegido de convite do Prismivo.", robots: { index: false, follow: false } };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const validToken = /^[a-f0-9]{64}$/.test(token);
  const identity = await getSessionUser();
  return <main className="access-page"><section className="access-card invitation-card"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true"><span /></span><span>PRISMIVO</span></Link><ShieldCheck className="invitation-icon" aria-hidden="true" /><span className="eyebrow">CONVITE PROTEGIDO</span><h1>Entre para colaborar com clareza.</h1><p>O convite só pode ser usado uma vez, pelo e-mail correto e dentro do prazo definido.</p>{!validToken ? <p className="form-message" role="alert">Este convite não é válido.</p> : identity ? <><p className="signed-in-copy">Conectado como <strong>{identity.email}</strong>.</p><AcceptInvitation token={token} /></> : <Link className="primary-button" href={signInPath(`/convite/${token}`)}>Entrar para aceitar</Link>}</section></main>;
}
