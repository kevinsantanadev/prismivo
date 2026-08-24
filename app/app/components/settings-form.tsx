"use client";

import { CheckCircle2, LayoutPanelLeft, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import {
  supportedLocales,
  useSitePreferences,
  type AccentColor,
  type ColorVisionMode,
  type ContentWidth,
  type CornerStyle,
  type InterfaceDensity,
  type InterfaceFilter,
  type MotionMode,
  type SidebarMode,
  type SiteLocale,
  type SiteTheme,
  type TextScale,
} from "@/app/components/site-preferences";
import { appShellCopy } from "@/lib/app-shell-i18n";
import {
  defaultPrimaryNavigation,
  normalizePrimaryNavigation,
  supportedQuickNavigationSections,
  type QuickNavigationSection,
} from "@/lib/interface-preferences";

type ProfilePreferences = {
  bio: string;
  jobTitle: string;
  phone: string;
  location: string;
  website: string;
  theme: string;
  accentColor: string;
  interfaceFilter: string;
  colorVisionMode: string;
  sidebarMode: string;
  interfaceDensity: string;
  contentWidth: string;
  cornerStyle: string;
  textScale: string;
  motionMode: string;
  primaryNavigation: readonly QuickNavigationSection[];
  organizationBrandColor: string;
  organizationVisualStyle: string;
};

const defaults: ProfilePreferences = {
  bio: "",
  jobTitle: "",
  phone: "",
  location: "",
  website: "",
  theme: "system",
  accentColor: "lime",
  interfaceFilter: "none",
  colorVisionMode: "standard",
  sidebarMode: "adaptive",
  interfaceDensity: "comfortable",
  contentWidth: "standard",
  cornerStyle: "rounded",
  textScale: "default",
  motionMode: "system",
  primaryNavigation: [...defaultPrimaryNavigation],
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
  const formRef = useRef<HTMLFormElement>(null);
  const initialLocale = supportedLocales.includes(userLocale as SiteLocale)
    ? userLocale as SiteLocale
    : requestLocale;
  const copy = getOperationalCopy(requestLocale);
  const shellCopy = appShellCopy[requestLocale];
  const {
    setLocale,
    setTheme,
    setAccentColor,
    setInterfaceFilter,
    setColorVisionMode,
    setSidebarMode,
    setInterfaceDensity,
    setContentWidth,
    setCornerStyle,
    setTextScale,
    setMotionMode,
  } = useSitePreferences();
  const [draftLocale, setDraftLocale] = useState<SiteLocale>(initialLocale);
  const [draftTheme, setDraftTheme] = useState<SiteTheme>(profile.theme as SiteTheme);
  const [draftAccentColor, setDraftAccentColor] = useState<AccentColor>(profile.accentColor as AccentColor);
  const [draftInterfaceFilter, setDraftInterfaceFilter] = useState<InterfaceFilter>(profile.interfaceFilter as InterfaceFilter);
  const [draftColorVisionMode, setDraftColorVisionMode] = useState<ColorVisionMode>(profile.colorVisionMode as ColorVisionMode);
  const [draftSidebarMode, setDraftSidebarMode] = useState<SidebarMode>(profile.sidebarMode as SidebarMode);
  const [draftInterfaceDensity, setDraftInterfaceDensity] = useState<InterfaceDensity>(profile.interfaceDensity as InterfaceDensity);
  const [draftContentWidth, setDraftContentWidth] = useState<ContentWidth>(profile.contentWidth as ContentWidth);
  const [draftCornerStyle, setDraftCornerStyle] = useState<CornerStyle>(profile.cornerStyle as CornerStyle);
  const [draftTextScale, setDraftTextScale] = useState<TextScale>(profile.textScale as TextScale);
  const [draftMotionMode, setDraftMotionMode] = useState<MotionMode>(profile.motionMode as MotionMode);
  const [draftPrimaryNavigation, setDraftPrimaryNavigation] = useState<QuickNavigationSection[]>(normalizePrimaryNavigation(profile.primaryNavigation));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [dirty, setDirty] = useState(false);

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
          locale: draftLocale,
          organizationName: data.get("organizationName"),
          bio: data.get("bio"),
          jobTitle: data.get("jobTitle"),
          phone: data.get("phone"),
          location: data.get("location"),
          website: data.get("website"),
          theme: draftTheme,
          accentColor: draftAccentColor,
          interfaceFilter: draftInterfaceFilter,
          colorVisionMode: draftColorVisionMode,
          sidebarMode: draftSidebarMode,
          interfaceDensity: draftInterfaceDensity,
          contentWidth: draftContentWidth,
          cornerStyle: draftCornerStyle,
          textScale: draftTextScale,
          motionMode: draftMotionMode,
          primaryNavigation: draftPrimaryNavigation,
          organizationBrandColor: data.get("organizationBrandColor"),
          organizationVisualStyle: data.get("organizationVisualStyle"),
        }),
      });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) { setMessage(requestLocale === "pt-BR" && result.error?.message ? result.error.message : copy.settings.saveError); return; }
      setLocale(draftLocale);
      setTheme(draftTheme);
      setAccentColor(draftAccentColor);
      setInterfaceFilter(draftInterfaceFilter);
      setColorVisionMode(draftColorVisionMode);
      setSidebarMode(draftSidebarMode);
      setInterfaceDensity(draftInterfaceDensity);
      setContentWidth(draftContentWidth);
      setCornerStyle(draftCornerStyle);
      setTextScale(draftTextScale);
      setMotionMode(draftMotionMode);
      setSuccess(true);
      setDirty(false);
      setMessage(getOperationalCopy(draftLocale).settings.saveSuccess);
      router.refresh();
    } catch { setMessage(copy.common.connectionError); }
    finally { setSubmitting(false); }
  }

  function discardChanges() {
    formRef.current?.reset();
    setDraftLocale(initialLocale);
    setDraftTheme(profile.theme as SiteTheme);
    setDraftAccentColor(profile.accentColor as AccentColor);
    setDraftInterfaceFilter(profile.interfaceFilter as InterfaceFilter);
    setDraftColorVisionMode(profile.colorVisionMode as ColorVisionMode);
    setDraftSidebarMode(profile.sidebarMode as SidebarMode);
    setDraftInterfaceDensity(profile.interfaceDensity as InterfaceDensity);
    setDraftContentWidth(profile.contentWidth as ContentWidth);
    setDraftCornerStyle(profile.cornerStyle as CornerStyle);
    setDraftTextScale(profile.textScale as TextScale);
    setDraftMotionMode(profile.motionMode as MotionMode);
    setDraftPrimaryNavigation(normalizePrimaryNavigation(profile.primaryNavigation));
    setMessage("");
    setSuccess(false);
    setDirty(false);
  }

  function updatePrimaryNavigation(slot: number, nextSection: QuickNavigationSection) {
    setDraftPrimaryNavigation((current) => {
      const next = [...current];
      const existingSlot = next.indexOf(nextSection);
      if (existingSlot >= 0 && existingSlot !== slot) next[existingSlot] = next[slot];
      next[slot] = nextSection;
      return next;
    });
  }

  return (
    <form ref={formRef} className="settings-form" onSubmit={submit} onChange={() => { setDirty(true); setMessage(""); setSuccess(false); }}>
      <section className="dashboard-panel settings-section" aria-labelledby="profile-settings-title">
        <div className="panel-heading"><div><span className="panel-kicker">{copy.settings.professionalProfile}</span><h2 id="profile-settings-title">{copy.settings.identity}</h2></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-name">{copy.settings.name}</label><input id="settings-name" name="name" defaultValue={name} minLength={2} maxLength={100} required /></div><div className="form-field"><label htmlFor="settings-email">{copy.settings.accessEmail}</label><input id="settings-email" value={email} disabled aria-describedby="email-help" /><small id="email-help">{copy.settings.emailHelp}</small></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-job-title">{copy.settings.jobTitle}</label><input id="settings-job-title" name="jobTitle" defaultValue={profile.jobTitle} maxLength={100} placeholder={copy.settings.jobPlaceholder} /></div><div className="form-field"><label htmlFor="settings-phone">{copy.settings.phone}</label><input id="settings-phone" name="phone" defaultValue={profile.phone} maxLength={32} autoComplete="tel" /></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-location">{copy.settings.location}</label><input id="settings-location" name="location" defaultValue={profile.location} maxLength={100} autoComplete="address-level2" /></div><div className="form-field"><label htmlFor="settings-website">{copy.settings.website}</label><input id="settings-website" name="website" defaultValue={profile.website} maxLength={240} inputMode="url" placeholder="https://..." /></div></div>
        <div className="form-field"><label htmlFor="settings-bio">{copy.settings.bio}</label><textarea id="settings-bio" name="bio" defaultValue={profile.bio} maxLength={360} rows={4} /><small>{copy.settings.bioLimit}</small></div>
      </section>

      <section className="dashboard-panel settings-section" aria-labelledby="workspace-settings-title">
        <div className="panel-heading"><div><span className="panel-kicker">{copy.settings.company}</span><h2 id="workspace-settings-title">{copy.settings.workspaceIdentity}</h2></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-organization">{copy.settings.companyName}</label><input id="settings-organization" name="organizationName" defaultValue={organizationName} minLength={2} maxLength={80} required disabled={!canEditOrganization} />{!canEditOrganization && <small>{copy.settings.noPermission}</small>}</div><div className="form-field"><label htmlFor="settings-locale">{copy.settings.language}</label><select id="settings-locale" name="locale" value={draftLocale} onChange={(event) => setDraftLocale(event.target.value as SiteLocale)}><option value="pt-BR">Português do Brasil</option><option value="en">English</option><option value="es">Español</option></select></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="organization-brand">{copy.settings.brandColor}</label><select id="organization-brand" name="organizationBrandColor" defaultValue={profile.organizationBrandColor} disabled={!canEditOrganization}><option value="lime">{copy.settings.colors.lime}</option><option value="violet">{copy.settings.colors.violet}</option><option value="blue">{copy.settings.colors.blue}</option><option value="amber">{copy.settings.colors.amber}</option><option value="teal">{copy.settings.colors.teal}</option><option value="rose">{copy.settings.colors.rose}</option></select></div><div className="form-field"><label htmlFor="organization-style">{copy.settings.visualStyle}</label><select id="organization-style" name="organizationVisualStyle" defaultValue={profile.organizationVisualStyle} disabled={!canEditOrganization}><option value="prism">{copy.settings.styles.prism}</option><option value="minimal">{copy.settings.styles.minimal}</option><option value="soft">{copy.settings.styles.soft}</option><option value="high-contrast">{copy.settings.styles.highContrast}</option></select></div></div>
      </section>

      <section className="dashboard-panel settings-section" aria-labelledby="appearance-settings-title">
        <div className="panel-heading"><div><span className="panel-kicker">{copy.settings.personalization}</span><h2 id="appearance-settings-title">{copy.settings.appearance}</h2></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-theme">{copy.settings.theme}</label><select id="settings-theme" value={draftTheme} onChange={(event) => setDraftTheme(event.target.value as SiteTheme)}><option value="system">{copy.settings.themes.system}</option><option value="light">{copy.settings.themes.light}</option><option value="dark">{copy.settings.themes.dark}</option><option value="mono">{copy.settings.themes.mono}</option></select></div><div className="form-field"><label htmlFor="settings-accent">{copy.settings.accent}</label><select id="settings-accent" value={draftAccentColor} onChange={(event) => setDraftAccentColor(event.target.value as AccentColor)}><option value="lime">{copy.settings.colors.lime}</option><option value="violet">{copy.settings.colors.violet}</option><option value="blue">{copy.settings.colors.blue}</option><option value="amber">{copy.settings.colors.amber}</option><option value="teal">{copy.settings.colors.teal}</option><option value="rose">{copy.settings.colors.rose}</option></select></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-sidebar">{copy.settings.sidebar}</label><select id="settings-sidebar" value={draftSidebarMode} onChange={(event) => setDraftSidebarMode(event.target.value as SidebarMode)}><option value="adaptive">{copy.settings.sidebars.adaptive}</option><option value="light">{copy.settings.sidebars.light}</option><option value="dark">{copy.settings.sidebars.dark}</option><option value="brand">{copy.settings.sidebars.brand}</option></select><small>{copy.settings.sidebarHelp}</small></div><div className="form-field"><label htmlFor="settings-density">{copy.settings.density}</label><select id="settings-density" value={draftInterfaceDensity} onChange={(event) => setDraftInterfaceDensity(event.target.value as InterfaceDensity)}><option value="compact">{copy.settings.densities.compact}</option><option value="comfortable">{copy.settings.densities.comfortable}</option><option value="spacious">{copy.settings.densities.spacious}</option></select></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-filter">{copy.settings.finish}</label><select id="settings-filter" value={draftInterfaceFilter} onChange={(event) => setDraftInterfaceFilter(event.target.value as InterfaceFilter)}><option value="none">{copy.settings.filters.none}</option><option value="soft">{copy.settings.filters.soft}</option><option value="crisp">{copy.settings.filters.crisp}</option><option value="grayscale">{copy.settings.filters.grayscale}</option></select></div><div className="form-field"><label htmlFor="settings-corners">{copy.settings.corners}</label><select id="settings-corners" value={draftCornerStyle} onChange={(event) => setDraftCornerStyle(event.target.value as CornerStyle)}><option value="soft">{copy.settings.cornerStyles.soft}</option><option value="rounded">{copy.settings.cornerStyles.rounded}</option><option value="square">{copy.settings.cornerStyles.square}</option></select></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-text-scale">{copy.settings.textScale}</label><select id="settings-text-scale" value={draftTextScale} onChange={(event) => setDraftTextScale(event.target.value as TextScale)}><option value="default">{copy.settings.textScales.default}</option><option value="large">{copy.settings.textScales.large}</option><option value="extra-large">{copy.settings.textScales.extraLarge}</option></select></div><div className="form-field"><label htmlFor="settings-motion">{copy.settings.motion}</label><select id="settings-motion" value={draftMotionMode} onChange={(event) => setDraftMotionMode(event.target.value as MotionMode)}><option value="system">{copy.settings.motions.system}</option><option value="full">{copy.settings.motions.full}</option><option value="reduced">{copy.settings.motions.reduced}</option></select></div></div>
        <div className="form-row"><div className="form-field"><label htmlFor="settings-color-vision">{copy.settings.colorVision}</label><select id="settings-color-vision" value={draftColorVisionMode} onChange={(event) => setDraftColorVisionMode(event.target.value as ColorVisionMode)}><option value="standard">{copy.settings.vision.standard}</option><option value="protanopia">{copy.settings.vision.protanopia}</option><option value="deuteranopia">{copy.settings.vision.deuteranopia}</option><option value="tritanopia">{copy.settings.vision.tritanopia}</option><option value="achromatopsia">{copy.settings.vision.achromatopsia}</option></select><small>{copy.settings.colorVisionHelp}</small></div><div className="form-field"><label htmlFor="settings-content-width">{copy.settings.contentWidth}</label><select id="settings-content-width" value={draftContentWidth} onChange={(event) => setDraftContentWidth(event.target.value as ContentWidth)}><option value="focused">{copy.settings.contentWidths.focused}</option><option value="standard">{copy.settings.contentWidths.standard}</option><option value="wide">{copy.settings.contentWidths.wide}</option></select></div></div>
        <div className="interface-preview" data-preview-theme={draftTheme} data-preview-sidebar={draftSidebarMode} aria-label={copy.settings.previewLabel}>
          <div className="interface-preview-sidebar"><span /><span /><span /></div>
          <div className="interface-preview-main"><header><Sparkles aria-hidden="true" /><span>{copy.settings.preview}</span></header><div><span /><span /><span /></div></div>
        </div>
      </section>

      <section className="dashboard-panel settings-section navigation-settings" aria-labelledby="navigation-settings-title">
        <div className="panel-heading"><div><span className="panel-kicker">{copy.settings.navigation}</span><h2 id="navigation-settings-title">{copy.settings.quickNavigation}</h2></div><LayoutPanelLeft aria-hidden="true" /></div>
        <p className="settings-section-intro">{copy.settings.quickNavigationHelp}</p>
        <div className="quick-navigation-grid">
          {draftPrimaryNavigation.map((section, index) => (
            <div className="form-field" key={index}>
              <label htmlFor={`settings-navigation-${index}`}>{copy.settings.shortcut} {index + 1}</label>
              <select id={`settings-navigation-${index}`} value={section} onChange={(event) => updatePrimaryNavigation(index, event.target.value as QuickNavigationSection)}>
                {supportedQuickNavigationSections.map((option) => <option key={option} value={option}>{shellCopy.nav[option]}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="quick-navigation-preview" aria-label={copy.settings.quickNavigationPreview}>
          {draftPrimaryNavigation.map((section, index) => <span key={section}><strong>{index + 1}</strong>{shellCopy.nav[section]}</span>)}
        </div>
      </section>
      {message && <div className={`form-message settings-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}
      {!message && dirty && <div className="settings-pending" role="status">{copy.settings.unsaved}</div>}
      <div className="settings-actions">
        <button className="app-secondary-button" type="button" onClick={discardChanges} disabled={submitting || !dirty}><RotateCcw aria-hidden="true" />{copy.settings.discard}</button>
        <button className="app-primary-button" type="submit" disabled={submitting || !dirty}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />{copy.common.saving}</> : copy.settings.save}</button>
      </div>
    </form>
  );
}
