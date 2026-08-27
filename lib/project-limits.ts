export type ProjectPlan = "free" | "professional" | "scale";

const fallbackActiveProjectLimits: Record<ProjectPlan, number | null> = {
  free: 3,
  professional: 50,
  scale: null,
};

export function activeProjectLimitForPlan(plan: string): number | null {
  return plan in fallbackActiveProjectLimits
    ? fallbackActiveProjectLimits[plan as ProjectPlan]
    : fallbackActiveProjectLimits.free;
}

export function normalizeActiveProjectLimit(value: unknown, plan: string): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(numeric)) return numeric < 0 ? null : Math.max(0, Math.trunc(numeric));
  return activeProjectLimitForPlan(plan);
}

export function isActiveProjectLimitReached(activeProjects: number, limit: number | null) {
  return limit !== null && activeProjects >= limit;
}
