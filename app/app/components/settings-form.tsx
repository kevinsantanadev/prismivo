"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
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
  requestLocale,
  name,
  email,
  locale: userLocale,
  organizationName,
  canEditOrganization,
  profile = defaults,
}: {
  requestLocale: SiteLocale;
  name: string;
  email: string;
  locale: string;
  organizationName: string;
  canEditOrganization: boolean;
  profile?: ProfilePreferences;
}) {
  const router = useRouter();
  const [displayLocale, setDisplayLocale] = useState<SiteLocale>(requestLocale);
  const copy = getOperationalCopy(displayLocale);
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
      if (!response.ok || !result.ok) { setMessage(requestLocale === "pt-BR" && result.error?.message ? result.error.message : copy.settings.saveError); return; }
      setSuccess(true); setMessage(copy.settings.saveSuccess); router.refresh();
    } catch { setMessage(copy.common.connectionError); }
    finally { setSubmitting(false); }
  }

  return (
    <form className="settings-form" onSubmit={submit}>
      <section className="dashboard-panel settings-section" aria-labelledby="profile-settings-title">
        <div className="panel-heading"><div><span className="panel-kicker">{copy.settings.professionalProfile}</span><h2 id="profile-settings-title">{copy.settings.identity}</h2></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-name">{copy.settings.name}</label><input id="settings-name" name="name" defaultValue={name} minLength={2} maxLength={100} required /></div><div className="form-field"><label htmlFor="settings-email">{copy.settings.accessEmail}</label><input id="settings-email" value={email} disabled aria-describedby="email-help" /><small id="email-help">{copy.settings.emailHelp}</small></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-job-title">{copy.settings.jobTitle}</label><input id="settings-job-title" name="jobTitle" defaultValue={profile.jobTitle} maxLength={100} placeholder={copy.settings.jobPlaceholder} /></div><div className="form-field"><label htmlFor="settings-phone">{copy.settings.phone}</label><input id="settings-phone" name="phone" defaultValue={profile.phone} maxLength={32} autoComplete="tel" /></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-location">{copy.settings.location}</label><input id="settings-location" name="location" defaultValue={profile.location} maxLength={100} autoComplete="address-level2" /></div><div className="form-field"><label htmlFor="settings-website">{copy.settings.website}</label><input id="settings-website" name="website" defaultValue={profile.website} maxLength={240} inputMode="url" placeholder="https://..." /></div></div>
        <div className="form-field"><label htmlFor="settings-bio">{copy.settings.bio}</label><textarea id="settings-bio" name="bio" defaultValue={profile.bio} maxLength={360} rows={4} /><small>{copy.settings.bioLimit}</small></div>
      </section>

      <section className="dashboard-panel settings-section" aria-labelledby="workspace-settings-title">
        <div className="panel-heading"><div><span className="panel-kicker">{copy.settings.company}</span><h2 id="workspace-settings-title">{copy.settings.workspaceIdentity}</h2></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-organization">{copy.settings.companyName}</label><input id="settings-organization" name="organizationName" defaultValue={organizationName} minLength={2} maxLength={80} required disabled={!canEditOrganization} />{!canEditOrganization && <small>{copy.settings.noPermission}</small>}</div><div className="form-field"><label htmlFor="settings-locale">{copy.settings.language}</label><select id="settings-locale" name="locale" value={locale} onChange={(event) => { const nextLocale = event.target.value as SiteLocale; setLocale(nextLocale); setDisplayLocale(nextLocale); }}><option value="pt-BR">Português do Brasil</option><option value="en">English</option><option value="es">Español</option></select></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="organization-brand">{copy.settings.brandColor}</label><select id="organization-brand" name="organizationBrandColor" defaultValue={profile.organizationBrandColor} disabled={!canEditOrganization}><option value="lime">{copy.settings.colors.lime}</option><option value="violet">{copy.settings.colors.violet}</option><option value="blue">{copy.settings.colors.blue}</option><option value="amber">{copy.settings.colors.amber}</option><option value="teal">{copy.settings.colors.teal}</option><option value="rose">{copy.settings.colors.rose}</option></select></div><div className="form-field"><label htmlFor="organization-style">{copy.settings.visualStyle}</label><select id="organization-style" name="organizationVisualStyle" defaultValue={profile.organizationVisualStyle} disabled={!canEditOrganization}><option value="prism">{copy.settings.styles.prism}</option><option value="minimal">{copy.settings.styles.minimal}</option><option value="soft">{copy.settings.styles.soft}</option><option value="high-contrast">{copy.settings.styles.highContrast}</option></select></div></div>
      </section>

      <section className="dashboard-panel settings-section" aria-labelledby="appearance-settings-title">
        <div className="panel-heading"><div><span className="panel-kicker">{copy.settings.personalization}</span><h2 id="appearance-settings-title">{copy.settings.appearance}</h2></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-theme">{copy.settings.theme}</label><select id="settings-theme" value={theme} onChange={(event) => setTheme(event.target.value as SiteTheme)}><option value="system">{copy.settings.themes.system}</option><option value="light">{copy.settings.themes.light}</option><option value="dark">{copy.settings.themes.dark}</option><option value="mono">{copy.settings.themes.mono}</option></select></div><div className="form-field"><label htmlFor="settings-accent">{copy.settings.accent}</label><select id="settings-accent" value={accentColor} onChange={(event) => setAccentColor(event.target.value as AccentColor)}><option value="lime">{copy.settings.colors.lime}</option><option value="violet">{copy.settings.colors.violet}</option><option value="blue">{copy.settings.colors.blue}</option><option value="amber">{copy.settings.colors.amber}</option><option value="teal">{copy.settings.colors.teal}</option><option value="rose">{copy.settings.colors.rose}</option></select></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-filter">{copy.settings.finish}</label><select id="settings-filter" value={interfaceFilter} onChange={(event) => setInterfaceFilter(event.target.value as InterfaceFilter)}><option value="none">{copy.settings.filters.none}</option><option value="soft">{copy.settings.filters.soft}</option><option value="crisp">{copy.settings.filters.crisp}</option><option value="grayscale">{copy.settings.filters.grayscale}</option></select></div><div className="form-field"><label htmlFor="settings-color-vision">{copy.settings.colorVision}</label><select id="settings-color-vision" value={colorVisionMode} onChange={(event) => setColorVisionMode(event.target.value as ColorVisionMode)}><option value="standard">{copy.settings.vision.standard}</option><option value="protanopia">{copy.settings.vision.protanopia}</option><option value="deuteranopia">{copy.settings.vision.deuteranopia}</option><option value="tritanopia">{copy.settings.vision.tritanopia}</option><option value="achromatopsia">{copy.settings.vision.achromatopsia}</option></select><small>{copy.settings.colorVisionHelp}</small></div></div>
      </section>
      {message && <div className={`form-message settings-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}
      <button className="app-primary-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />{copy.common.saving}</> : copy.settings.save}</button>
    </form>
  );
}
