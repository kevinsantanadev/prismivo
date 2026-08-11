import { getSessionUser } from "@/app/session-auth";
import { apiError } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { buildCsvDocument } from "@/lib/reports/csv";
import { getAdministrationExportRows } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { adminReportQuerySchema } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";

export async function GET(request: Request) {
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "admin.view")) return apiError("FORBIDDEN", "Acesso administrativo necessário.", 403);
  if (!isSupabaseConfigured()) return apiError("REPORTS_UNAVAILABLE", "Os relatórios exigem o ambiente de dados seguro.", 503);

  const url = new URL(request.url);
  const parsed = adminReportQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Filtros de relatório inválidos.", 422);

  try {
    const rows = await getAdministrationExportRows(workspace.organizationId, parsed.data);
    const csv = buildCsvDocument(
      ["Data e hora", "Tipo", "Título", "Detalhe", "Recurso", "Identificador"],
      rows.map((item) => [
        new Date(item.created_at).toISOString(),
        item.type,
        item.title,
        item.detail,
        item.resource_type,
        item.resource_id,
      ]),
    );
    const date = new Date().toISOString().slice(0, 10);
    return new Response(`\uFEFF${csv}`, {
      headers: {
        "cache-control": "private, no-store",
        "content-disposition": `attachment; filename="prismivo-auditoria-${date}.csv"`,
        "content-type": "text/csv; charset=utf-8",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("admin_report_export_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("REPORT_EXPORT_FAILED", "Não foi possível gerar o relatório.", 500);
  }
}
