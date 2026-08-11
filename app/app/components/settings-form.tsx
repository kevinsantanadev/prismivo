"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  supportedLocales,
  useSitePreferences,
  type AccentColor,
  type ColorVisionMode,
  type InterfaceFilter,
  type SiteLocale,
  type SiteTheme,
} from "@/app/components/site-preferences";

type ProfilePreferences = {
  bio: string;
  jobTitle: string;
  phone: string;
  location: string;
  website: string;
  accentColor: string;
  interfaceFilter: string;
  colorVisionMode: string;
  organizationBrandColor: string;
  organizationVisualStyle: string;
};

const defaults: ProfilePreferences = {
  bio: "",
  jobTitle: "",
  phone: "",
  location: "",
  website: "",
  accentColor: "lime",
  interfaceFilter: "none",
  colorVisionMode: "standard",
  organizationBrandColor: "lime",
  organizationVisualStyle: "prism",
};

export function SettingsForm({
  name,
  email,
  locale: userLocale,
  organizationName,
  canEditOrganization,
  profile = defaults,
}: {
  name: string;
  email: string;
  locale: string;
  organizationName: string;
  canEditOrganization: boolean;
  profile?: ProfilePreferences;
}) {
  const router = useRouter();
  const {
    locale, setLocale, theme, setTheme,
    accentColor, setAccentColor,
    interfaceFilter, setInterfaceFilter,
    colorVisionMode, setColorVisionMode,
  } = useSitePreferences();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (supportedLocales.includes(userLocale as SiteLocale)) setLocale(userLocale as SiteLocale);
    setAccentColor(profile.accentColor as AccentColor);
    setInterfaceFilter(profile.interfaceFilter as InterfaceFilter);
    setColorVisionMode(profile.colorVisionMode as ColorVisionMode);
  }, [profile.accentColor, profile.colorVisionMode, profile.interfaceFilter, setAccentColor, setColorVisionMode, setInterfaceFilter, setLocale, userLocale]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const data = new FormData(event.currentTarget);
    setSubmitting(true); setMessage(""); setSuccess(false);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          locale: data.get("locale"),
          organizationName: data.get("organizationName"),
          bio: data.get("bio"),
          jobTitle: data.get("jobTitle"),
          phone: data.get("phone"),
          location: data.get("location"),
          website: data.get("website"),
          accentColor,
          interfaceFilter,
          colorVisionMode,
          organizationBrandColor: data.get("organizationBrandColor"),
          organizationVisualStyle: data.get("organizationVisualStyle"),
        }),
      });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) { setMessage(result.error?.message ?? "Não foi possível salvar."); return; }
      setSuccess(true); setMessage("Perfil e preferências salvos com segurança."); router.refresh();
    } catch { setMessage("A conexão falhou. Tente novamente."); }
    finally { setSubmitting(false); }
  }

  return (
    <form className="settings-form" onSubmit={submit}>
      <section className="dashboard-panel settings-section" aria-labelledby="profile-settings-title">
        <div className="panel-heading"><div><span className="panel-kicker">PERFIL PROFISSIONAL</span><h2 id="profile-settings-title">Identidade e apresentação</h2></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-name">Nome</label><input id="settings-name" name="name" defaultValue={name} minLength={2} maxLength={100} required /></div><div className="form-field"><label htmlFor="settings-email">E-mail de acesso</label><input id="settings-email" value={email} disabled aria-describedby="email-help" /><small id="email-help">Vinculado à identidade usada no acesso.</small></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-job-title">Cargo ou especialidade</label><input id="settings-job-title" name="jobTitle" defaultValue={profile.jobTitle} maxLength={100} placeholder="Ex.: Diretora de Operações" /></div><div className="form-field"><label htmlFor="settings-phone">Telefone</label><input id="settings-phone" name="phone" defaultValue={profile.phone} maxLength={32} autoComplete="tel" /></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-location">Localização</label><input id="settings-location" name="location" defaultValue={profile.location} maxLength={100} autoComplete="address-level2" /></div><div className="form-field"><label htmlFor="settings-website">Site profissional</label><input id="settings-website" name="website" defaultValue={profile.website} maxLength={240} inputMode="url" placeholder="https://..." /></div></div>
        <div className="form-field"><label htmlFor="settings-bio">Biografia curta</label><textarea id="settings-bio" name="bio" defaultValue={profile.bio} maxLength={360} rows={4} /><small>Até 360 caracteres.</small></div>
      </section>

      <section className="dashboard-panel settings-section" aria-labelledby="workspace-settings-title">
        <div className="panel-heading"><div><span className="panel-kicker">EMPRESA</span><h2 id="workspace-settings-title">Identidade do espaço</h2></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-organization">Nome da empresa</label><input id="settings-organization" name="organizationName" defaultValue={organizationName} minLength={2} maxLength={80} required disabled={!canEditOrganization} />{!canEditOrganization && <small>Seu papel não permite alterar este campo.</small>}</div><div className="form-field"><label htmlFor="settings-locale">Idioma preferido</label><select id="settings-locale" name="locale" value={locale} onChange={(event) => setLocale(event.target.value as SiteLocale)}><option value="pt-BR">Português do Brasil</option><option value="en">English</option><option value="es">Español</option></select></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="organization-brand">Cor da marca</label><select id="organization-brand" name="organizationBrandColor" defaultValue={profile.organizationBrandColor} disabled={!canEditOrganization}><option value="lime">Lima</option><option value="violet">Violeta</option><option value="blue">Azul</option><option value="amber">Âmbar</option><option value="teal">Turquesa</option><option value="rose">Rosa</option></select></div><div className="form-field"><label htmlFor="organization-style">Estilo visual</label><select id="organization-style" name="organizationVisualStyle" defaultValue={profile.organizationVisualStyle} disabled={!canEditOrganization}><option value="prism">Prisma</option><option value="minimal">Minimalista</option><option value="soft">Suave</option><option value="high-contrast">Alto contraste</option></select></div></div>
      </section>

      <section className="dashboard-panel settings-section" aria-labelledby="appearance-settings-title">
        <div className="panel-heading"><div><span className="panel-kicker">PERSONALIZAÇÃO E ACESSIBILIDADE</span><h2 id="appearance-settings-title">Aparência da interface</h2></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-theme">Tema neste dispositivo</label><select id="settings-theme" value={theme} onChange={(event) => setTheme(event.target.value as SiteTheme)}><option value="system">Automático — seguir o sistema</option><option value="light">Claro</option><option value="dark">Escuro</option><option value="mono">Preto e branco</option></select></div><div className="form-field"><label htmlFor="settings-accent">Cor de destaque</label><select id="settings-accent" value={accentColor} onChange={(event) => setAccentColor(event.target.value as AccentColor)}><option value="lime">Lima</option><option value="violet">Violeta</option><option value="blue">Azul</option><option value="amber">Âmbar</option><option value="teal">Turquesa</option><option value="rose">Rosa</option></select></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-filter">Acabamento visual</label><select id="settings-filter" value={interfaceFilter} onChange={(event) => setInterfaceFilter(event.target.value as InterfaceFilter)}><option value="none">Padrão</option><option value="soft">Suave</option><option value="crisp">Nítido</option><option value="grayscale">Escala de cinza</option></select></div><div className="form-field"><label htmlFor="settings-color-vision">Percepção de cores</label><select id="settings-color-vision" value={colorVisionMode} onChange={(event) => setColorVisionMode(event.target.value as ColorVisionMode)}><option value="standard">Padrão</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option><option value="achromatopsia">Acromatopsia</option></select><small>As paletas mantêm significado também por texto, ícones e contraste.</small></div></div>
      </section>
      {message && <div className={`form-message settings-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}
      <button className="app-primary-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />Salvando…</> : "Salvar alterações"}</button>
    </form>
  );
}
