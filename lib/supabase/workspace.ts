import { createSupabaseServerClient } from "./server";

export type SupabaseWorkspace = {
  userId: string;
  userName: string;
  userEmail: string;
  userLocale: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  plan: string;
  role: string;
  avatarPath: string | null;
  avatarUrl: string | null;
  bio: string;
  jobTitle: string;
  phone: string;
  location: string;
  website: string;
  theme: string;
  accentColor: string;
  interfaceFilter: string;
  colorVisionMode: string;
  organizationBrandColor: string;
  organizationVisualStyle: string;
};

export async function findSupabaseWorkspaceByEmail(email: string): Promise<SupabaseWorkspace | null> {
  const supabase = await createSupabaseServerClient();
  const normalizedEmail = email.trim().toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, name, locale, status, avatar_path, bio, job_title, phone, location, website, theme, accent_color, interface_filter, color_vision_mode")
    .eq("email", normalizedEmail)
    .eq("status", "active")
    .maybeSingle();

  if (profileError || !profile) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("role, status, organization:organizations!inner(id, name, slug, plan, status, brand_color, visual_style)")
    .eq("user_id", profile.id)
    .eq("status", "active")
    .eq("organization.status", "active")
    .limit(1)
    .maybeSingle();

  const organizationValue = membership?.organization;
  const organization = Array.isArray(organizationValue)
    ? organizationValue[0]
    : organizationValue;

  if (membershipError || !membership || !organization) return null;

  let avatarUrl: string | null = null;
  if (profile.avatar_path) {
    const signed = await supabase.storage.from("prismivo-avatars").createSignedUrl(profile.avatar_path, 60 * 60);
    avatarUrl = signed.data?.signedUrl ?? null;
  }

  return {
    userId: profile.id,
    userName: profile.name,
    userEmail: profile.email,
    userLocale: profile.locale,
    organizationId: organization.id,
    organizationName: organization.name,
    organizationSlug: organization.slug,
    plan: organization.plan,
    role: membership.role,
    avatarPath: profile.avatar_path,
    avatarUrl,
    bio: profile.bio,
    jobTitle: profile.job_title,
    phone: profile.phone,
    location: profile.location,
    website: profile.website,
    theme: profile.theme,
    accentColor: profile.accent_color,
    interfaceFilter: profile.interface_filter,
    colorVisionMode: profile.color_vision_mode,
    organizationBrandColor: organization.brand_color,
    organizationVisualStyle: organization.visual_style,
  };
}
