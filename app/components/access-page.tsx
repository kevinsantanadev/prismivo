import { ArrowLeft, ArrowRight, Check, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AuthForm } from "@/app/components/auth-form";

type AccessPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  alternateLabel: string;
  alternateHref: string;
  alternateText: string;
  benefits: string[];
  mode?: "login" | "signup" | "recover" | "reset";
  returnTo?: string;
};

export function AccessPage({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  alternateLabel,
  alternateHref,
  alternateText,
  benefits,
  mode,
  returnTo,
}: AccessPageProps) {
  return (
    <div className="access-page">
      <a className="skip-link" href="#conteudo-acesso">Pular para o conteúdo</a>
      <header className="access-header">
        <Link className="brand" href="/" aria-label="Prismivo — página inicial">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>PRISMIVO</span>
        </Link>
        <Link className="access-back" href="/"><ArrowLeft aria-hidden="true" /> Voltar ao site</Link>
      </header>

      <main id="conteudo-acesso" className="access-main">
        <section className="access-copy" aria-labelledby="access-title">
          <span className="eyebrow">{eyebrow}</span>
          <h1 id="access-title">{title}</h1>
          <p>{description}</p>
          <ul>
            {benefits.map((benefit) => <li key={benefit}><Check aria-hidden="true" />{benefit}</li>)}
          </ul>
          <div className="access-trust"><ShieldCheck aria-hidden="true" /><span><strong>Conta protegida</strong>Identidade confirmada sem expor sua senha ao Prismivo.</span></div>
        </section>

        <section className="access-card" aria-label="Acesso seguro">
          <span className="access-icon" aria-hidden="true"><LockKeyhole /></span>
          <h2>Acesso seguro</h2>
          <p>Sua identidade é confirmada por um fluxo de acesso seguro. Depois, você cria o espaço da empresa e já pode usar o plano gratuito.</p>
          {mode
            ? <AuthForm mode={mode} returnTo={returnTo} />
            : <a className="button access-primary" href={primaryHref}>{primaryLabel}<ArrowRight aria-hidden="true" /></a>}
          <div className="access-divider"><span>sem cartão de crédito</span></div>
          <p className="access-alternate">{alternateText} <Link href={alternateHref}>{alternateLabel}</Link></p>
          <small>Ao continuar, você poderá revisar e aceitar os <Link href="/legal/termos">Termos de Uso</Link> e a <Link href="/legal/privacidade">Política de Privacidade</Link> durante a configuração. Conheça também nossos <Link href="/legal/seguranca">controles de segurança</Link>.</small>
        </section>
      </main>

      <footer className="access-footer">© 2026 Prismivo. Todos os direitos reservados.</footer>
    </div>
  );
}
