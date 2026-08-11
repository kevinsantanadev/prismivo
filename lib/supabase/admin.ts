import { createSupabaseServerClient } from "./server";

export async function getAdministrationOverview(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const [members, clients, projects, openTickets, pendingApprovals, activities] = await Promise.all([
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).neq("status", "closed"),
    supabase.from("approvals").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "pending"),
    supabase.from("activities").select("id, type, title, detail, resource_type, resource_id, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(20),
  ]);
  const error = [members.error, clients.error, projects.error, openTickets.error, pendingApprovals.error, activities.error].find(Boolean);
  if (error) throw error;
  return {
    metrics: {
      members: members.count ?? 0,
      clients: clients.count ?? 0,
      projects: projects.count ?? 0,
      openTickets: openTickets.count ?? 0,
      pendingApprovals: pendingApprovals.count ?? 0,
    },
    activities: activities.data ?? [],
  };
}
