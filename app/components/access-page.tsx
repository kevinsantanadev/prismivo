import { Activity, ArrowLeft, Check, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AuthForm } from "@/app/components/auth-form";
import { PreferencesMenu } from "@/app/components/preferences-menu";
import {
  authPageCopy,
  authSharedCopy,
  type AuthMode,
} from "@/lib/auth-i18n";
import type { SiteLocale } from "@/lib/site-locale";

type AccessPageProps = {
  locale: SiteLocale;
  mode: AuthMode;
  returnTo?: string;
  notice?: string;
};

export function AccessPage({
  locale,
  mode,
  returnTo,
  notice,
}: AccessPageProps) {
  const page = authPageCopy[locale][mode];
  const shared = authSharedCopy[locale];

  return (
    <div className="access-page" lang={locale}>
      <div className="access-ambient" aria-hidden="true"><span /><span /><span /></div>
      <a className="skip-link" href="#conteudo-acesso">{shared.skip}</a>
      <header className="access-header">
        <Link className="brand" href="/" aria-label={shared.homeLabel}>
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>PRISMIVO</span>
        </Link>
        <div className="access-header-actions">
          <PreferencesMenu />
          <Link className="access-back" href="/"><ArrowLeft aria-hidden="true" /> {shared.back}</Link>
        </div>
      </header>

      <main id="conteudo-acesso" className="access-main">
        <section className="access-copy" aria-labelledby="access-title">
          <span className="eyebrow">{page.eyebrow}</span>
          <h1 id="access-title">{page.title}</h1>
          <p>{page.description}</p>
          <ul>
            {page.benefits.map((benefit) => <li key={benefit}><Check aria-hidden="true" />{benefit}</li>)}
          </ul>
          <div className="access-trust"><ShieldCheck aria-hidden="true" /><span><strong>{shared.protectedTitle}</strong>{shared.protectedDescription}</span></div>
        </section>

        <section className="access-card" aria-label={shared.cardLabel}>
          <div className="access-card-status">
            <span className="access-card-status-label">
              <Activity aria-hidden="true" />
              <span>{shared.flowLabel}</span>
            </span>
            <small className="access-status-badge">{shared.flowStatus}</small>
          </div>
          <span className="access-icon" aria-hidden="true"><LockKeyhole /></span>
          <h2>{shared.cardTitle}</h2>
          <p>{shared.cardDescription}</p>
          {notice && <div className="auth-message error" role="alert">{notice}</div>}
          <AuthForm mode={mode} locale={locale} returnTo={returnTo} />
          <div className="access-divider"><span>{shared.noCard}</span></div>
          <p className="access-alternate">{page.alternateText} <Link href={page.alternateHref}>{page.alternateLabel}</Link></p>
          <small>{shared.legalPrefix} <Link href="/legal/termos">{shared.terms}</Link> {shared.privacyJoin} <Link href="/legal/privacidade">{shared.privacy}</Link> {shared.setupSuffix} <Link href="/legal/seguranca">{shared.security}</Link>.</small>
        </section>
      </main>

      <footer className="access-footer">© 2026 Prismivo. {shared.footer}</footer>
    </div>
  );
}
