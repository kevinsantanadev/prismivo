"use client";

import { ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { getManagementCopy } from "@/lib/app-management-i18n";
import type { SiteLocale } from "@/lib/site-locale";

type FieldErrors = Record<string, string>;

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42);
}

export function OnboardingForm({ locale, name, email }: { locale: SiteLocale; name: string; email: string }) {
  const copy = getManagementCopy(locale).onboarding;
  const [organizationName, setOrganizationName] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [industry, setIndustry] = useState("agency");
  const [teamSize, setTeamSize] = useState("solo");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const suggestedSlug = useMemo(() => slugify(organizationName), [organizationName]);
  const slug = customSlug || suggestedSlug;
  const fieldError = (field: string) => locale === "pt-BR" ? errors[field] : errors[field] ? (field === "acceptedTerms" || field === "acceptedPrivacy" ? copy.consentError : copy.fieldError) : undefined;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setErrors({}); setMessage("");
    try {
      const response = await fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organizationName, slug, industry, teamSize, acceptedTerms, acceptedPrivacy }) });
      const result = await response.json() as { ok: boolean; data?: { redirectTo: string }; error?: { message: string; fields?: FieldErrors } };
      if (!response.ok || !result.ok) {
        setErrors(result.error?.fields ?? {});
        setMessage(locale === "pt-BR" ? result.error?.message ?? copy.error : copy.error);
        return;
      }
      window.location.assign(result.data?.redirectTo ?? "/app");
    } catch { setMessage(copy.connectionError); } finally { setSubmitting(false); }
  }

  return <form className="onboarding-form" onSubmit={submit} noValidate>
    <div className="onboarding-identity"><span><CheckCircle2 aria-hidden="true" /></span><div><strong>{copy.identity}</strong><small>{name} · {email}</small></div></div>

    <div className="form-field">
      <label htmlFor="organizationName">{copy.organization}</label>
      <input id="organizationName" name="organizationName" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder={copy.organizationPlaceholder} autoComplete="organization" aria-invalid={Boolean(errors.organizationName)} aria-describedby={errors.organizationName ? "organizationName-error" : undefined} />
      {fieldError("organizationName") && <span id="organizationName-error" className="field-error">{fieldError("organizationName")}</span>}
    </div>

    <div className="form-field">
      <label htmlFor="slug">{copy.slug}</label>
      <div className="slug-input"><span>prismivo/</span><input id="slug" name="slug" value={slug} onChange={(event) => setCustomSlug(slugify(event.target.value))} placeholder={copy.slugPlaceholder} aria-invalid={Boolean(errors.slug)} aria-describedby={errors.slug ? "slug-error" : "slug-help"} /></div>
      <small id="slug-help">{copy.slugHelp}</small>
      {fieldError("slug") && <span id="slug-error" className="field-error">{fieldError("slug")}</span>}
    </div>

    <div className="form-row">
      <div className="form-field"><label htmlFor="industry">{copy.industry}</label><select id="industry" name="industry" value={industry} onChange={(event) => setIndustry(event.target.value)}><option value="agency">{copy.industries.agency}</option><option value="consulting">{copy.industries.consulting}</option><option value="technology">{copy.industries.technology}</option><option value="architecture">{copy.industries.architecture}</option><option value="professional-services">{copy.industries.professional}</option><option value="other">{copy.industries.other}</option></select></div>
      <div className="form-field"><label htmlFor="teamSize">{copy.teamSize}</label><select id="teamSize" name="teamSize" value={teamSize} onChange={(event) => setTeamSize(event.target.value)}><option value="solo">{copy.sizes.solo}</option><option value="2-5">{copy.sizes.small}</option><option value="6-15">{copy.sizes.medium}</option><option value="16-30">{copy.sizes.large}</option><option value="31+">{copy.sizes.enterprise}</option></select></div>
    </div>

    <label className="check-field"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} aria-invalid={Boolean(errors.acceptedTerms)} /><span>{copy.terms} <a href="/legal/termos" target="_blank" rel="noreferrer">{copy.termsLink}</a>.</span></label>
    {fieldError("acceptedTerms") && <span className="field-error">{fieldError("acceptedTerms")}</span>}

    <label className="check-field"><input type="checkbox" checked={acceptedPrivacy} onChange={(event) => setAcceptedPrivacy(event.target.checked)} aria-invalid={Boolean(errors.acceptedPrivacy)} /><span>{copy.privacy} <a href="/legal/privacidade" target="_blank" rel="noreferrer">{copy.privacyLink}</a> {copy.privacySuffix}</span></label>
    {fieldError("acceptedPrivacy") && <span className="field-error">{fieldError("acceptedPrivacy")}</span>}

    {message && <div className="form-message" role="alert">{message}</div>}
    <button className="button onboarding-submit" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />{copy.creating}</> : <>{copy.create}<ArrowRight aria-hidden="true" /></>}</button>
    <p className="form-security"><ShieldCheck aria-hidden="true" />{copy.security}</p>
  </form>;
}
