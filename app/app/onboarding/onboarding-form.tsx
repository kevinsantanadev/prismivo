"use client";

import { ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type FieldErrors = Record<string, string>;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
}

export function OnboardingForm({ name, email }: { name: string; email: string }) {
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors({});
    setMessage("");

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationName, slug, industry, teamSize, acceptedTerms, acceptedPrivacy }),
      });
      const result = await response.json() as {
        ok: boolean;
        data?: { redirectTo: string };
        error?: { message: string; fields?: FieldErrors };
      };

      if (!response.ok || !result.ok) {
        setErrors(result.error?.fields ?? {});
        setMessage(result.error?.message ?? "Não foi possível concluir a configuração.");
        return;
      }

      window.location.assign(result.data?.redirectTo ?? "/app");
    } catch {
      setMessage("A conexão falhou. Seus dados continuam no formulário; tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="onboarding-form" onSubmit={submit} noValidate>
      <div className="onboarding-identity">
        <span><CheckCircle2 aria-hidden="true" /></span>
        <div><strong>Identidade confirmada</strong><small>{name} · {email}</small></div>
      </div>

      <div className="form-field">
        <label htmlFor="organizationName">Nome da empresa ou operação</label>
        <input id="organizationName" name="organizationName" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="Ex.: Estúdio Horizonte" autoComplete="organization" aria-invalid={Boolean(errors.organizationName)} aria-describedby={errors.organizationName ? "organizationName-error" : undefined} />
        {errors.organizationName && <span id="organizationName-error" className="field-error">{errors.organizationName}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="slug">Endereço interno</label>
        <div className="slug-input"><span>prismivo/</span><input id="slug" name="slug" value={slug} onChange={(event) => setCustomSlug(slugify(event.target.value))} placeholder="sua-empresa" aria-invalid={Boolean(errors.slug)} aria-describedby={errors.slug ? "slug-error" : "slug-help"} /></div>
        <small id="slug-help">Se o endereço já existir, criaremos uma variação segura automaticamente.</small>
        {errors.slug && <span id="slug-error" className="field-error">{errors.slug}</span>}
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="industry">Segmento</label>
          <select id="industry" name="industry" value={industry} onChange={(event) => setIndustry(event.target.value)}>
            <option value="agency">Agência ou estúdio</option>
            <option value="consulting">Consultoria</option>
            <option value="technology">Tecnologia</option>
            <option value="architecture">Arquitetura</option>
            <option value="professional-services">Serviços profissionais</option>
            <option value="other">Outro</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="teamSize">Tamanho da equipe</label>
          <select id="teamSize" name="teamSize" value={teamSize} onChange={(event) => setTeamSize(event.target.value)}>
            <option value="solo">Somente eu</option>
            <option value="2-5">2 a 5 pessoas</option>
            <option value="6-15">6 a 15 pessoas</option>
            <option value="16-30">16 a 30 pessoas</option>
            <option value="31+">31 ou mais</option>
          </select>
        </div>
      </div>

      <label className="check-field">
        <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} aria-invalid={Boolean(errors.acceptedTerms)} />
        <span>Li e aceito os <a href="/legal/termos" target="_blank" rel="noreferrer">Termos de Uso</a>.</span>
      </label>
      {errors.acceptedTerms && <span className="field-error">{errors.acceptedTerms}</span>}

      <label className="check-field">
        <input type="checkbox" checked={acceptedPrivacy} onChange={(event) => setAcceptedPrivacy(event.target.checked)} aria-invalid={Boolean(errors.acceptedPrivacy)} />
        <span>Li a <a href="/legal/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a> e compreendo como meus dados serão tratados.</span>
      </label>
      {errors.acceptedPrivacy && <span className="field-error">{errors.acceptedPrivacy}</span>}

      {message && <div className="form-message" role="alert">{message}</div>}

      <button className="button onboarding-submit" type="submit" disabled={submitting}>
        {submitting ? <><LoaderCircle className="spin" aria-hidden="true" />Criando espaço…</> : <>Criar espaço gratuito<ArrowRight aria-hidden="true" /></>}
      </button>
      <p className="form-security"><ShieldCheck aria-hidden="true" />O servidor confirma sua identidade e associa os dados somente à sua empresa.</p>
    </form>
  );
}
