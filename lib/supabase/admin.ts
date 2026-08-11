import { createSupabaseServerClient } from "./server";

const ACTIVITY_LIMIT = 1000;
const PAGE_SIZE = 20;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type AdminReportFilters = {
  period: 7 | 30 | 90;
  type: string;
  query: string;
  page: number;
};

export type AdministrationActivity = {
  id: string;
  actor_user_id: string | null;
  type: string;
  title: string;
  detail: string;
  resource_type: string | null;
  resource_id: string | null;
  created_at: string;
};

export async function getAdministrationOverview(
  organizationId: string,
  filters: AdminReportFilters = { period: 30, type: "all", query: "", page: 1 },
) {
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - filters.period * DAY_IN_MS).toISOString();
  const [members, clients, projects, openTickets, pendingApprovals, activityResult] = await Promise.all([
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).neq("status", "closed"),
    supabase.from("approvals").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "pending"),
    supabase
      .from("activities")
      .select("id, actor_user_id, type, title, detail, resource_type, resource_id, created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_LIMIT),
  ]);
  const error = [members.error, clients.error, projects.error, openTickets.error, pendingApprovals.error, activityResult.error].find(Boolean);
  if (error) throw error;

  const allActivities = (activityResult.data ?? []) as AdministrationActivity[];
  const filteredActivities = filterActivities(allActivities, filters);
  const pageCount = Math.max(1, Math.ceil(filteredActivities.length / PAGE_SIZE));
  const currentPage = Math.min(filters.page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;

  return {
    metrics: {
      members: members.count ?? 0,
      clients: clients.count ?? 0,
      projects: projects.count ?? 0,
      openTickets: openTickets.count ?? 0,
      pendingApprovals: pendingApprovals.count ?? 0,
      periodActivities: allActivities.length,
    },
    activities: filteredActivities.slice(start, start + PAGE_SIZE),
    activityTypes: [...new Set(allActivities.map((item) => item.type))].sort(),
    timeline: buildTimeline(allActivities, filters.period),
    pagination: {
      page: currentPage,
      pageCount,
      total: filteredActivities.length,
      pageSize: PAGE_SIZE,
    },
    filters: { ...filters, page: currentPage },
  };
}

export async function getAdministrationExportRows(
  organizationId: string,
  filters: AdminReportFilters,
): Promise<AdministrationActivity[]> {
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - filters.period * DAY_IN_MS).toISOString();
  const result = await supabase
    .from("activities")
    .select("id, actor_user_id, type, title, detail, resource_type, resource_id, created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(ACTIVITY_LIMIT);
  if (result.error) throw result.error;
  return filterActivities((result.data ?? []) as AdministrationActivity[], filters);
}

function filterActivities(
  activities: AdministrationActivity[],
  filters: Pick<AdminReportFilters, "type" | "query">,
) {
  const query = filters.query.toLocaleLowerCase("pt-BR");
  return activities.filter((activity) => {
    if (filters.type !== "all" && activity.type !== filters.type) return false;
    if (!query) return true;
    return [activity.title, activity.detail, activity.type, activity.resource_type ?? ""]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(query));
  });
}

function buildTimeline(activities: AdministrationActivity[], period: 7 | 30 | 90) {
  const bucketCount = 7;
  const end = Date.now();
  const start = end - period * DAY_IN_MS;
  const bucketDuration = (end - start) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    start: new Date(start + index * bucketDuration).toISOString(),
    end: new Date(start + (index + 1) * bucketDuration).toISOString(),
    count: 0,
  }));

  for (const activity of activities) {
    const timestamp = new Date(activity.created_at).getTime();
    if (!Number.isFinite(timestamp) || timestamp < start || timestamp > end) continue;
    const index = Math.min(bucketCount - 1, Math.floor((timestamp - start) / bucketDuration));
    buckets[index].count += 1;
  }
  return buckets;
}
