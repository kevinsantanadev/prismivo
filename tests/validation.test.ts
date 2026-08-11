import { describe, expect, it } from "vitest";
import { isJsonRequest, isSameOriginRequest } from "../lib/api";
import { hasPermission } from "../lib/permissions";
import {
  approvalDecisionSchema,
  approvalSchema,
  clientSchema,
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
