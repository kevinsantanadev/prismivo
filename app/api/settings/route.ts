import { and, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, organizations, users } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { asD1Batch } from "@/lib/db-batch";
import { settingsSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { updateProfileRecord } from "@/lib/supabase/profile";

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);

  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = settingsSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Revise os campos destacados.", 422, zodFieldErrors(parsed.error));
  const canEditOrganization = workspace.role === "owner" || workspace.role === "admin";
  if (!canEditOrganization && parsed.data.organizationName !== workspace.organizationName) {
    return apiError("FORBIDDEN", "Seu papel não permite alterar a empresa.", 403);
  }

  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await updateProfileRecord(workspace, parsed.data));
  }

  const db = getDb();
  try {
    const statements: BatchItem<"sqlite">[] = [
      db.update(users)
        .set({
          name: parsed.data.name,
          locale: parsed.data.locale,
          bio: parsed.data.bio,
          jobTitle: parsed.data.jobTitle,
          phone: parsed.data.phone,
          location: parsed.data.location,
          website: parsed.data.website,
          theme: parsed.data.theme,
          accentColor: parsed.data.accentColor,
          interfaceFilter: parsed.data.interfaceFilter,
          colorVisionMode: parsed.data.colorVisionMode,
          sidebarMode: parsed.data.sidebarMode,
          interfaceDensity: parsed.data.interfaceDensity,
          contentWidth: parsed.data.contentWidth,
          cornerStyle: parsed.data.cornerStyle,
          textScale: parsed.data.textScale,
          motionMode: parsed.data.motionMode,
          primaryNavigation: parsed.data.primaryNavigation.join(","),
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(users.id, workspace.userId)),
      db.insert(activities).values({
        id: `act_${crypto.randomUUID()}`,
        organizationId: workspace.organizationId,
        actorUserId: workspace.userId,
        type: "settings.updated",
        title: "Configurações atualizadas",
        detail: "Perfil e preferências foram salvos.",
        resourceType: "user",
        resourceId: workspace.userId,
      }),
    ];
    if (canEditOrganization) {
      statements.push(
        db.update(organizations)
          .set({
            name: parsed.data.organizationName,
            brandColor: parsed.data.organizationBrandColor,
            visualStyle: parsed.data.organizationVisualStyle,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(and(eq(organizations.id, workspace.organizationId), eq(organizations.status, "active"))),
      );
    }
    await db.batch(asD1Batch(statements));
  } catch (error) {
    console.error("settings_update_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("SETTINGS_UPDATE_FAILED", "Não foi possível salvar as configurações.", 500);
  }
  return apiSuccess({ updated: true });
}
