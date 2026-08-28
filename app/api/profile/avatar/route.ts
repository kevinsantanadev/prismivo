import { getSessionUser } from "@/app/session-auth";
import { apiError, isSameOriginRequest } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { deleteProfileAvatar, downloadProfileAvatar, uploadProfileAvatar } from "@/lib/supabase/profile";
import { findWorkspaceByEmail } from "@/lib/workspace";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function getWorkspace() {
  if (!isSupabaseConfigured()) return { response: apiError("FEATURE_UNAVAILABLE", "Fotos de perfil exigem o ambiente independente.", 503) };
  const identity = await getSessionUser();
  if (!identity) return { response: apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401) };
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return { response: apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409) };
  return { workspace };
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_AVATAR_BYTES + 200_000) return apiError("AVATAR_TOO_LARGE", "A foto deve ter no máximo 2 MB.", 413);
  const authorized = await getWorkspace();
  if ("response" in authorized) return authorized.response;
  let formData: FormData;
  try { formData = await request.formData(); } catch { return apiError("INVALID_FORM", "Não foi possível ler a foto.", 400); }
  const file = formData.get("avatar");
  if (!(file instanceof File)) return apiError("AVATAR_REQUIRED", "Selecione uma foto.", 422);
  if (file.size === 0 || file.size > MAX_AVATAR_BYTES || !ALLOWED[file.type]) return apiError("AVATAR_INVALID", "Envie JPG, PNG ou WebP com até 2 MB.", 422);
  const bytes = await file.arrayBuffer();
  if (!hasImageSignature(file.type, new Uint8Array(bytes))) return apiError("AVATAR_SIGNATURE_INVALID", "O conteúdo não corresponde ao formato da imagem.", 422);
  return supabaseMutationResponse(await uploadProfileAvatar(authorized.workspace, { extension: ALLOWED[file.type], contentType: file.type, bytes }), 201);
}

export async function GET() {
  const authorized = await getWorkspace();
  if ("response" in authorized) return authorized.response;
  const result = await downloadProfileAvatar(authorized.workspace);
  if (!result.ok) return apiError(result.code, result.message, result.status);
  return new Response(result.data.body, {
    headers: {
      "cache-control": "private, no-store",
      "content-length": String(result.data.size),
      "content-type": result.data.contentType,
      "x-content-type-options": "nosniff",
    },
  });
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  const authorized = await getWorkspace();
  if ("response" in authorized) return authorized.response;
  return supabaseMutationResponse(await deleteProfileAvatar(authorized.workspace));
}

function hasImageSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return type === "image/webp" && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}
