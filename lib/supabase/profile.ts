import type { MutationResult } from "./mutations";
import { createSupabaseServerClient } from "./server";

const AVATAR_BUCKET = "prismivo-avatars";

type Workspace = {
  userId: string;
  organizationId: string;
  role: string;
};

export async function updateProfileRecord(
  workspace: Workspace,
  input: {
    name: string;
    locale: string;
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
    primaryNavigation: string[];
    organizationName: string;
    organizationBrandColor: string;
    organizationVisualStyle: string;
  },
): Promise<MutationResult<{ updated: true }>> {
  const supabase = await createSupabaseServerClient();
  const { error: profileError } = await supabase.from("profiles").update({
    name: input.name,
    locale: input.locale,
    bio: input.bio,
    job_title: input.jobTitle,
    phone: input.phone,
    location: input.location,
    website: input.website,
    theme: input.theme,
    accent_color: input.accentColor,
    interface_filter: input.interfaceFilter,
    color_vision_mode: input.colorVisionMode,
    sidebar_mode: input.sidebarMode,
    interface_density: input.interfaceDensity,
    content_width: input.contentWidth,
    corner_style: input.cornerStyle,
    text_scale: input.textScale,
    motion_mode: input.motionMode,
    primary_navigation: input.primaryNavigation,
    updated_at: new Date().toISOString(),
  }).eq("id", workspace.userId);
  if (profileError) return failure("PROFILE_UPDATE_FAILED", "Não foi possível salvar o perfil.");

  if (workspace.role === "owner" || workspace.role === "admin") {
    const { error: organizationError } = await supabase.from("organizations").update({
      name: input.organizationName,
      brand_color: input.organizationBrandColor,
      visual_style: input.organizationVisualStyle,
      updated_at: new Date().toISOString(),
    }).eq("id", workspace.organizationId).eq("status", "active");
    if (organizationError) return failure("ORGANIZATION_UPDATE_FAILED", "O perfil foi salvo, mas a identidade da empresa não pôde ser atualizada.");
  }

  await supabase.from("activities").insert({
    id: `act_${crypto.randomUUID()}`,
    organization_id: workspace.organizationId,
    actor_user_id: workspace.userId,
    type: "profile.updated",
    title: "Perfil profissional atualizado",
    detail: "Informações pessoais e preferências visuais foram revisadas.",
    resource_type: "profile",
    resource_id: workspace.userId,
  });
  return { ok: true, data: { updated: true } };
}

export async function uploadProfileAvatar(
  workspace: Workspace,
  input: { extension: "jpg" | "png" | "webp"; contentType: string; bytes: ArrayBuffer },
): Promise<MutationResult<{ path: string; url: string }>> {
  const supabase = await createSupabaseServerClient();
  const current = await supabase.from("profiles").select("avatar_path").eq("id", workspace.userId).maybeSingle();
  if (current.error) return failure("AVATAR_UPLOAD_FAILED", "Não foi possível preparar o envio da foto.");

  const path = `${workspace.userId}/${crypto.randomUUID()}.${input.extension}`;
  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, input.bytes, {
    contentType: input.contentType,
    upsert: false,
    cacheControl: "3600",
  });
  if (uploadError) return failure("AVATAR_UPLOAD_FAILED", "Não foi possível salvar a foto agora.");

  const { error: updateError } = await supabase.from("profiles").update({ avatar_path: path, updated_at: new Date().toISOString() }).eq("id", workspace.userId);
  if (updateError) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    return failure("AVATAR_UPLOAD_FAILED", "Não foi possível associar a foto ao perfil.");
  }

  if (current.data?.avatar_path) await supabase.storage.from(AVATAR_BUCKET).remove([current.data.avatar_path]);
  const signed = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 60 * 60);
  if (signed.error || !signed.data?.signedUrl) return failure("AVATAR_URL_FAILED", "A foto foi salva, mas não pôde ser exibida agora.");
  return { ok: true, data: { path, url: signed.data.signedUrl } };
}

export async function deleteProfileAvatar(
  workspace: Workspace,
): Promise<MutationResult<{ removed: true }>> {
  const supabase = await createSupabaseServerClient();
  const current = await supabase.from("profiles").select("avatar_path").eq("id", workspace.userId).maybeSingle();
  if (current.error) return failure("AVATAR_DELETE_FAILED", "Não foi possível localizar a foto.");
  if (!current.data?.avatar_path) return { ok: true, data: { removed: true } };
  const { error } = await supabase.from("profiles").update({ avatar_path: null, updated_at: new Date().toISOString() }).eq("id", workspace.userId);
  if (error) return failure("AVATAR_DELETE_FAILED", "Não foi possível remover a foto.");
  await supabase.storage.from(AVATAR_BUCKET).remove([current.data.avatar_path]);
  return { ok: true, data: { removed: true } };
}

function failure<T>(code: string, message: string): MutationResult<T> {
  return { ok: false, code, message, status: 500 };
}
