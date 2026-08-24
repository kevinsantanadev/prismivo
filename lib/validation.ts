import { z } from "zod";

export const onboardingSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, "Informe o nome da empresa.")
    .max(80, "Use no máximo 80 caracteres."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "O endereço deve ter pelo menos 3 caracteres.")
    .max(42, "O endereço deve ter no máximo 42 caracteres.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras, números e hífens."),
  industry: z.enum([
    "agency",
    "consulting",
    "technology",
    "architecture",
    "professional-services",
    "other",
  ]),
  teamSize: z.enum(["solo", "2-5", "6-15", "16-30", "31+"]),
  acceptedTerms: z.literal(true, {
    error: "Você precisa aceitar os Termos de Uso.",
  }),
  acceptedPrivacy: z.literal(true, {
    error: "Você precisa confirmar a leitura da Política de Privacidade.",
  }),
});

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do projeto.")
    .max(90, "Use no máximo 90 caracteres."),
  clientName: z
    .string()
    .trim()
    .min(2, "Informe o nome do cliente.")
    .max(90, "Use no máximo 90 caracteres."),
  description: z.string().trim().max(500, "Use no máximo 500 caracteres."),
  dueDate: z
    .string()
    .trim()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Informe uma data válida.",
    }),
});

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do cliente.")
    .max(90, "Use no máximo 90 caracteres."),
  email: z
    .string()
    .trim()
    .max(160, "Use no máximo 160 caracteres.")
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: "Informe um e-mail válido.",
    }),
  company: z
    .string()
    .trim()
    .max(120, "Use no máximo 120 caracteres."),
});

export const approvalSchema = z.object({
  projectId: z.string().trim().min(1, "Selecione um projeto."),
  title: z
    .string()
    .trim()
    .min(3, "Informe o que precisa ser aprovado.")
    .max(120, "Use no máximo 120 caracteres."),
  description: z
    .string()
    .trim()
    .max(700, "Use no máximo 700 caracteres."),
  dueDate: z
    .string()
    .trim()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Informe uma data válida.",
    }),
});

export const approvalDecisionSchema = z.object({
  decision: z.enum(["approved", "changes_requested"]),
});

export const projectProgressSchema = z.object({
  progress: z.number().int().min(0).max(100),
});

export const notificationActionSchema = z.object({
  notificationId: z.string().trim().min(1).optional(),
  markAll: z.boolean().optional(),
}).refine((data) => Boolean(data.notificationId) !== Boolean(data.markAll), {
  message: "Informe uma única ação de notificação.",
});

export const settingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(100, "Use no máximo 100 caracteres."),
  locale: z.enum(["pt-BR", "en", "es"]),
  organizationName: z
    .string()
    .trim()
    .min(2, "Informe o nome da empresa.")
    .max(80, "Use no máximo 80 caracteres."),
  bio: z.string().trim().max(360, "Use no máximo 360 caracteres."),
  jobTitle: z.string().trim().max(100, "Use no máximo 100 caracteres."),
  phone: z.string().trim().max(32, "Use no máximo 32 caracteres."),
  location: z.string().trim().max(100, "Use no máximo 100 caracteres."),
  website: z.string().trim().max(240, "Use no máximo 240 caracteres.").refine((value) => !value || /^https?:\/\/[^\s]+$/i.test(value), "Informe um endereço iniciado por http:// ou https://."),
  theme: z.enum(["system", "light", "dark", "mono"]),
  accentColor: z.enum(["lime", "violet", "blue", "amber", "teal", "rose"]),
  interfaceFilter: z.enum(["none", "soft", "crisp", "grayscale"]),
  colorVisionMode: z.enum(["standard", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"]),
  organizationBrandColor: z.enum(["lime", "violet", "blue", "amber", "teal", "rose"]),
  organizationVisualStyle: z.enum(["prism", "minimal", "soft", "high-contrast"]),
});

export const invitationSchema = z.object({
  email: z.email("Informe um e-mail válido.").trim().toLowerCase().max(254, "Use no máximo 254 caracteres."),
  role: z.enum(["admin", "editor", "support", "viewer"]),
});

export const invitationTokenSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "Convite inválido."),
});

export const memberAccessSchema = z.object({
  role: z.enum(["owner", "admin", "editor", "support", "viewer"]),
  status: z.enum(["active", "suspended"]),
});

export const taskSchema = z.object({
  projectId: z.string().trim().min(1, "Selecione um projeto."),
  title: z.string().trim().min(3, "Informe o título da tarefa.").max(120, "Use no máximo 120 caracteres."),
  description: z.string().trim().max(700, "Use no máximo 700 caracteres."),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().trim().refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), { message: "Informe uma data válida." }),
});

export const taskStatusSchema = z.object({ status: z.enum(["todo", "in_progress", "done"]) });

export const ticketSchema = z.object({
  clientId: z.string().trim().optional(),
  category: z.enum(["technical", "billing", "access", "question", "other"]),
  priority: z.enum(["low", "normal", "high"]),
  subject: z.string().trim().min(4, "Informe o assunto do atendimento.").max(140, "Use no máximo 140 caracteres."),
  message: z.string().trim().min(10, "Descreva a solicitação com pelo menos 10 caracteres.").max(3000, "Use no máximo 3.000 caracteres."),
});

export const ticketMessageSchema = z.object({
  message: z.string().trim().min(2, "Escreva uma mensagem.").max(3000, "Use no máximo 3.000 caracteres."),
});

export const ticketStatusSchema = z.object({ action: z.enum(["close", "reopen"]) });

export const adminReportQuerySchema = z.object({
  period: z
    .enum(["7", "30", "90"])
    .default("30")
    .transform((value) => Number(value) as 7 | 30 | 90),
  type: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^(?:all|[a-z0-9_.-]+)$/i, "Tipo de atividade inválido.")
    .default("all"),
  query: z.string().trim().max(100, "Use no máximo 100 caracteres.").default(""),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export const contentItemSchema = z.object({
  kind: z.enum(["article", "case_study", "service", "help"]),
  slug: z
    .string()
    .trim()
    .min(3, "Informe um endereço com pelo menos 3 caracteres.")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens."),
  title: z.string().trim().min(4).max(160),
  excerpt: z.string().trim().min(20).max(320),
  body: z.string().trim().min(80).max(30000),
  tags: z.array(z.string().trim().min(2).max(32)).max(8).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const contentStatusSchema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});

export const billingSubscriptionSchema = z.object({
  planCode: z.enum(["free", "professional", "scale"]),
  billingCycle: z.enum(["monthly", "annual"]),
});

export const deliverableSchema = z.object({
  title: z.string().trim().min(3, "Informe o nome do entregável.").max(140, "Use no máximo 140 caracteres."),
  description: z.string().trim().max(1200, "Use no máximo 1.200 caracteres.").default(""),
});

export const deliverableVersionSchema = z.object({
  summary: z.string().trim().max(1000, "Use no máximo 1.000 caracteres.").default(""),
  requestApproval: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export const deliverableCommentSchema = z.object({
  body: z.string().trim().min(2, "Escreva um comentário.").max(3000, "Use no máximo 3.000 caracteres."),
  versionId: z.string().trim().max(120).optional(),
});

export function zodFieldErrors(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
  }
  return fields;
}
