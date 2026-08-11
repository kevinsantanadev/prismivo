import { describe, expect, it } from "vitest";
import { isJsonRequest, isSameOriginRequest } from "../lib/api";
import { exceedsMultipartLimit, MAX_FILE_BYTES, MAX_MULTIPART_OVERHEAD_BYTES } from "../lib/file-validation";
import { hasPermission } from "../lib/permissions";
import {
  adminReportQuerySchema,
  approvalDecisionSchema,
  approvalSchema,
  billingSubscriptionSchema,
  clientSchema,
  contentItemSchema,
  contentStatusSchema,
  deliverableCommentSchema,
  deliverableSchema,
  deliverableVersionSchema,
  invitationSchema,
  memberAccessSchema,
  notificationActionSchema,
  onboardingSchema,
  projectProgressSchema,
  projectSchema,
  settingsSchema,
  taskSchema,
  taskStatusSchema,
  ticketMessageSchema,
  ticketSchema,
  ticketStatusSchema,
} from "../lib/validation";
import { buildCsvDocument, escapeCsvCell } from "../lib/reports/csv";
import { normalizeSiteLocale } from "../lib/site-locale";
import { translateAppShellText } from "../lib/app-shell-i18n";

describe("site locale", () => {
  it("accepts every supported locale and safely falls back to PT-BR", () => {
    expect(normalizeSiteLocale("pt-BR")).toBe("pt-BR");
    expect(normalizeSiteLocale("en")).toBe("en");
    expect(normalizeSiteLocale("es")).toBe("es");
    expect(normalizeSiteLocale("../../admin")).toBe("pt-BR");
    expect(normalizeSiteLocale(null)).toBe("pt-BR");
  });

  it("translates known authenticated shell labels without changing user content", () => {
    expect(translateAppShellText("Visão geral", "en")).toBe("Overview");
    expect(translateAppShellText("Perfil, empresa e preferências", "es")).toBe("Perfil, empresa y preferencias");
    expect(translateAppShellText("Projeto Aurora", "en")).toBe("Projeto Aurora");
  });
});

describe("onboarding validation", () => {
  it("accepts a complete free-workspace setup", () => {
    const result = onboardingSchema.safeParse({
      organizationName: "Estúdio Horizonte",
      slug: "estudio-horizonte",
      industry: "agency",
      teamSize: "2-5",
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsafe or malformed organization slugs", () => {
    const result = onboardingSchema.safeParse({
      organizationName: "Estúdio Horizonte",
      slug: "../../outra-organizacao",
      industry: "agency",
      teamSize: "2-5",
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    expect(result.success).toBe(false);
  });

  it("requires explicit terms acceptance", () => {
    const result = onboardingSchema.safeParse({
      organizationName: "Estúdio Horizonte",
      slug: "estudio-horizonte",
      industry: "agency",
      teamSize: "2-5",
      acceptedTerms: false,
      acceptedPrivacy: true,
    });

    expect(result.success).toBe(false);
  });

  it("requires explicit privacy notice confirmation", () => {
    const result = onboardingSchema.safeParse({
      organizationName: "Estúdio Horizonte",
      slug: "estudio-horizonte",
      industry: "agency",
      teamSize: "2-5",
      acceptedTerms: true,
      acceptedPrivacy: false,
    });

    expect(result.success).toBe(false);
  });
});

describe("collaborative operations validation", () => {
  it("accepts a bounded task attached to a project", () => {
    expect(taskSchema.safeParse({ projectId: "prj_123", title: "Revisar entrega do portal", description: "Validar o fluxo principal antes da aprovação.", priority: "high", dueDate: "2026-08-18" }).success).toBe(true);
  });
  it("rejects unknown task priorities and malformed dates", () => {
    expect(taskSchema.safeParse({ projectId: "prj_123", title: "Revisar entrega", description: "", priority: "critical", dueDate: "18/08/2026" }).success).toBe(false);
  });
  it("limits task transitions to supported workflow states", () => {
    expect(taskStatusSchema.safeParse({ status: "in_progress" }).success).toBe(true);
    expect(taskStatusSchema.safeParse({ status: "archived_by_admin" }).success).toBe(false);
  });
  it("accepts a complete support request", () => {
    expect(ticketSchema.safeParse({ clientId: "cli_123", category: "technical", priority: "normal", subject: "Erro ao abrir o documento", message: "O documento não abriu durante a revisão do projeto." }).success).toBe(true);
  });
  it("rejects underspecified support messages", () => {
    expect(ticketSchema.safeParse({ category: "other", priority: "low", subject: "Ajuda", message: "Curta" }).success).toBe(false);
  });
  it("validates ticket replies and controlled close actions", () => {
    expect(ticketMessageSchema.safeParse({ message: "Resposta registrada." }).success).toBe(true);
    expect(ticketStatusSchema.safeParse({ action: "close" }).success).toBe(true);
    expect(ticketStatusSchema.safeParse({ action: "delete" }).success).toBe(false);
  });
});

describe("project validation", () => {
  it("accepts a valid project and ISO due date", () => {
    const result = projectSchema.safeParse({
      name: "Portal do cliente",
      clientName: "Empresa Exemplo",
      description: "Centralização das aprovações e arquivos.",
      dueDate: "2026-10-15",
    });

    expect(result.success).toBe(true);
  });

  it("rejects malformed due dates and empty ownership context", () => {
    const result = projectSchema.safeParse({
      name: "A",
      clientName: "",
      description: "",
      dueDate: "15/10/2026",
    });

    expect(result.success).toBe(false);
  });
});

describe("state-changing request guards", () => {
  it("accepts same-origin JSON requests", () => {
    const request = new Request("https://prismivo.example/api/projects", {
      method: "POST",
      headers: {
        origin: "https://prismivo.example",
        "content-type": "application/json; charset=utf-8",
      },
    });

    expect(isSameOriginRequest(request)).toBe(true);
    expect(isJsonRequest(request)).toBe(true);
  });

  it("rejects cross-origin submissions", () => {
    const request = new Request("https://prismivo.example/api/projects", {
      method: "POST",
      headers: {
        origin: "https://malicious.example",
        "content-type": "application/json",
      },
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });
});

describe("operational module validation", () => {
  it("accepts a client with optional professional contact data", () => {
    expect(clientSchema.safeParse({
      name: "Marina Albuquerque",
      email: "marina@empresa.test",
      company: "Horizonte Studio",
    }).success).toBe(true);
  });

  it("rejects invalid client email addresses", () => {
    expect(clientSchema.safeParse({
      name: "Marina Albuquerque",
      email: "email-invalido",
      company: "Horizonte Studio",
    }).success).toBe(false);
  });

  it("requires approval requests to be attached to a project", () => {
    expect(approvalSchema.safeParse({
      projectId: "",
      title: "Aprovar identidade visual",
      description: "Versão final para produção.",
      dueDate: "2026-09-12",
    }).success).toBe(false);
  });

  it("limits approval decisions to known server states", () => {
    expect(approvalDecisionSchema.safeParse({ decision: "approved" }).success).toBe(true);
    expect(approvalDecisionSchema.safeParse({ decision: "admin_override" }).success).toBe(false);
  });

  it("accepts only bounded integer project progress", () => {
    expect(projectProgressSchema.safeParse({ progress: 75 }).success).toBe(true);
    expect(projectProgressSchema.safeParse({ progress: 120 }).success).toBe(false);
  });

  it("requires exactly one notification action", () => {
    expect(notificationActionSchema.safeParse({ markAll: true }).success).toBe(true);
    expect(notificationActionSchema.safeParse({ markAll: true, notificationId: "not_1" }).success).toBe(false);
  });

  it("validates supported account locales", () => {
    const profile = { name: "Kevin Reis", locale: "pt-BR", organizationName: "Prismivo Lab", bio: "", jobTitle: "", phone: "", location: "", website: "https://example.test", accentColor: "lime", interfaceFilter: "none", colorVisionMode: "standard", organizationBrandColor: "lime", organizationVisualStyle: "prism" };
    expect(settingsSchema.safeParse(profile).success).toBe(true);
    expect(settingsSchema.safeParse({ ...profile, locale: "xx" }).success).toBe(false);
  });
});

describe("team permissions and invitations", () => {
  it("allows owners and admins to manage people", () => {
    expect(hasPermission("owner", "team.manage")).toBe(true);
    expect(hasPermission("admin", "team.manage")).toBe(true);
    expect(hasPermission("editor", "team.manage")).toBe(false);
  });

  it("keeps viewers read-only while support can answer tickets", () => {
    expect(hasPermission("viewer", "projects.write")).toBe(false);
    expect(hasPermission("support", "support.write")).toBe(true);
    expect(hasPermission("support", "files.write")).toBe(false);
  });

  it("accepts bounded invitation roles and rejects owners", () => {
    expect(invitationSchema.safeParse({ email: "pessoa@empresa.test", role: "editor" }).success).toBe(true);
    expect(invitationSchema.safeParse({ email: "pessoa@empresa.test", role: "owner" }).success).toBe(false);
  });

  it("accepts only controlled member states", () => {
    expect(memberAccessSchema.safeParse({ role: "viewer", status: "suspended" }).success).toBe(true);
    expect(memberAccessSchema.safeParse({ role: "root", status: "active" }).success).toBe(false);
  });
});

describe("administrative reporting", () => {
  it("normalizes supported audit filters", () => {
    const result = adminReportQuerySchema.safeParse({ period: "90", type: "project.created", query: "entrega", page: "3" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ period: 90, type: "project.created", query: "entrega", page: 3 });
  });

  it("rejects unsupported periods and unsafe activity types", () => {
    expect(adminReportQuerySchema.safeParse({ period: "365", type: "all" }).success).toBe(false);
    expect(adminReportQuerySchema.safeParse({ period: "30", type: "type,or(true)" }).success).toBe(false);
  });

  it("escapes spreadsheet formulas and quotes in CSV cells", () => {
    expect(escapeCsvCell("=IMPORTXML('x')")).toBe("\"'=IMPORTXML('x')\"");
    expect(escapeCsvCell('Ação "concluída"')).toBe('"Ação ""concluída"""');
  });

  it("builds a deterministic CSV document", () => {
    expect(buildCsvDocument(["Título", "Total"], [["Entrega", 2]])).toBe('"Título","Total"\r\n"Entrega","2"');
  });
});

describe("content and demonstrative billing", () => {
  const content = {
    kind: "article",
    slug: "operacoes-com-clareza",
    title: "Operações com clareza",
    excerpt: "Um resumo profissional com contexto suficiente para orientar a leitura.",
    body: "Este conteúdo possui detalhes suficientes para passar pela validação editorial e representar um material real do estúdio.",
    tags: ["operações", "gestão"],
    status: "draft",
  };

  it("accepts bounded editorial content and known workflow states", () => {
    expect(contentItemSchema.safeParse(content).success).toBe(true);
    expect(contentStatusSchema.safeParse({ status: "published" }).success).toBe(true);
  });

  it("rejects unsafe slugs and unsupported content states", () => {
    expect(contentItemSchema.safeParse({ ...content, slug: "../../admin" }).success).toBe(false);
    expect(contentStatusSchema.safeParse({ status: "deleted_forever" }).success).toBe(false);
  });

  it("limits billing changes to server-supported plans and cycles", () => {
    expect(billingSubscriptionSchema.safeParse({ planCode: "professional", billingCycle: "annual" }).success).toBe(true);
    expect(billingSubscriptionSchema.safeParse({ planCode: "custom-price", billingCycle: "daily" }).success).toBe(false);
  });

  it("grants content and billing permissions only to expected roles", () => {
    expect(hasPermission("editor", "content.write")).toBe(true);
    expect(hasPermission("editor", "billing.manage")).toBe(false);
    expect(hasPermission("admin", "billing.manage")).toBe(true);
  });
});

describe("versioned deliverables and protected attachments", () => {
  it("accepts a bounded deliverable", () => {
    expect(deliverableSchema.safeParse({ title: "Guia de identidade", description: "Entrega principal da marca." }).success).toBe(true);
  });

  it("rejects invalid deliverables and oversized comments", () => {
    expect(deliverableSchema.safeParse({ title: "X", description: "" }).success).toBe(false);
    expect(deliverableCommentSchema.safeParse({ body: "x".repeat(3001) }).success).toBe(false);
  });

  it("normalizes the server-supported approval flag", () => {
    const result = deliverableVersionSchema.safeParse({ summary: "Ajusta contraste", requestApproval: "true" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.requestApproval).toBe(true);
  });

  it("allows viewers to comment without granting version writes", () => {
    expect(hasPermission("viewer", "comments.write")).toBe(true);
    expect(hasPermission("viewer", "deliverables.write")).toBe(false);
    expect(hasPermission("editor", "deliverables.write")).toBe(true);
  });

  it("rejects multipart bodies above the protected upload limit", () => {
    const request = new Request("https://prismivo.test/upload", { headers: { "content-length": String(MAX_FILE_BYTES + MAX_MULTIPART_OVERHEAD_BYTES + 1) } });
    expect(exceedsMultipartLimit(request)).toBe(true);
  });
});
