export const agendaKinds = ["task", "approval", "project"] as const;
export type AgendaKind = (typeof agendaKinds)[number];

export type AgendaEvent = {
  id: string;
  sourceId: string;
  kind: AgendaKind;
  title: string;
  context: string;
  clientName: string | null;
  date: string;
  status: string;
  priority: string | null;
  href: string;
};

type AgendaTask = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  priority: string;
  projectName: string;
  clientName: string | null;
};

type AgendaApproval = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  projectId: string;
  projectName: string;
  clientName: string | null;
};

type AgendaProject = {
  id: string;
  name: string;
  dueDate: string | null;
  status: string;
  clientName: string | null;
};

export type AgendaPeriod = "overdue" | "today" | "next" | "later";

/** Creates one chronological timeline without changing the source records. */
export function buildAgendaEvents(input: {
  tasks: AgendaTask[];
  approvals: AgendaApproval[];
  projects: AgendaProject[];
}): AgendaEvent[] {
  const taskEvents = input.tasks
    .filter((task) => task.dueDate && task.status !== "done")
    .map((task): AgendaEvent => ({
      id: `task:${task.id}`,
      sourceId: task.id,
      kind: "task",
      title: task.title,
      context: task.projectName,
      clientName: task.clientName,
      date: task.dueDate!,
      status: task.status,
      priority: task.priority,
      href: "/app/tarefas",
    }));

  const approvalEvents = input.approvals
    .filter((approval) => approval.dueDate && approval.status === "pending")
    .map((approval): AgendaEvent => ({
      id: `approval:${approval.id}`,
      sourceId: approval.id,
      kind: "approval",
      title: approval.title,
      context: approval.projectName,
      clientName: approval.clientName,
      date: approval.dueDate!,
      status: approval.status,
      priority: null,
      href: `/app/projetos/${approval.projectId}`,
    }));

  const projectEvents = input.projects
    .filter((project) => project.dueDate && !["completed", "archived"].includes(project.status))
    .map((project): AgendaEvent => ({
      id: `project:${project.id}`,
      sourceId: project.id,
      kind: "project",
      title: project.name,
      context: project.clientName ?? "",
      clientName: project.clientName,
      date: project.dueDate!,
      status: project.status,
      priority: null,
      href: `/app/projetos/${project.id}`,
    }));

  return [...taskEvents, ...approvalEvents, ...projectEvents]
    .sort((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title));
}

export function dateKeyInSaoPaulo(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function classifyAgendaDate(date: string, today = dateKeyInSaoPaulo()): AgendaPeriod {
  if (date < today) return "overdue";
  if (date === today) return "today";
  const distance = differenceInCalendarDays(today, date);
  return distance <= 7 ? "next" : "later";
}

export function summarizeAgenda(events: AgendaEvent[], today = dateKeyInSaoPaulo()) {
  return events.reduce(
    (summary, event) => {
      const period = classifyAgendaDate(event.date, today);
      summary[period] += 1;
      summary.total += 1;
      return summary;
    },
    { total: 0, overdue: 0, today: 0, next: 0, later: 0 },
  );
}

export type ClientInsight = {
  clientId: string;
  activeProjects: number;
  overdueProjects: number;
  averageProgress: number;
  nextDeadline: string | null;
  health: "healthy" | "attention" | "inactive";
};

export function deriveClientInsights(
  clients: Array<{ id: string; status: string }>,
  projects: Array<{ clientId?: string | null; status: string; progress: number; dueDate: string | null }>,
  today = dateKeyInSaoPaulo(),
): ClientInsight[] {
  return clients.map((client) => {
    const linked = projects.filter((project) => project.clientId === client.id);
    const active = linked.filter((project) => !["completed", "archived"].includes(project.status));
    const overdue = active.filter((project) => project.dueDate && project.dueDate < today);
    const deadlines = active
      .map((project) => project.dueDate)
      .filter((date): date is string => date !== null && date >= today)
      .sort();
    const averageProgress = linked.length
      ? Math.round(linked.reduce((total, project) => total + project.progress, 0) / linked.length)
      : 0;
    const health = client.status !== "active" || linked.length === 0
      ? "inactive"
      : overdue.length > 0
        ? "attention"
        : "healthy";
    return {
      clientId: client.id,
      activeProjects: active.length,
      overdueProjects: overdue.length,
      averageProgress,
      nextDeadline: deadlines[0] ?? null,
      health,
    };
  });
}

export function calculateOperationScore(input: {
  overdue: number;
  dueToday: number;
  activeProjects: number;
  pendingApprovals: number;
}) {
  const penalty = input.overdue * 9 + input.dueToday * 3 + Math.max(0, input.pendingApprovals - 2) * 2;
  const activityBonus = input.activeProjects > 0 ? 4 : 0;
  return Math.max(24, Math.min(100, 92 - penalty + activityBonus));
}

export const dashboardWidgetIds = ["metrics", "agenda", "projects", "pulse", "activity", "notifications"] as const;
export type DashboardWidgetId = (typeof dashboardWidgetIds)[number];
export const defaultDashboardWidgets: readonly DashboardWidgetId[] = dashboardWidgetIds;

export type SmartRoutineId = "task" | "approval" | "project";
export type SmartRoutinePreferences = Record<SmartRoutineId, { enabled: boolean; leadDays: number }>;

export const defaultSmartRoutines: SmartRoutinePreferences = {
  task: { enabled: true, leadDays: 3 },
  approval: { enabled: true, leadDays: 2 },
  project: { enabled: true, leadDays: 7 },
};

export function getSmartAlerts(
  events: AgendaEvent[],
  preferences: SmartRoutinePreferences,
  today = dateKeyInSaoPaulo(),
) {
  return events.filter((event) => {
    const routine = preferences[event.kind];
    if (!routine.enabled) return false;
    const distance = differenceInCalendarDays(today, event.date);
    return distance <= routine.leadDays;
  });
}

function differenceInCalendarDays(from: string, to: string) {
  const start = Date.parse(`${from}T12:00:00Z`);
  const end = Date.parse(`${to}T12:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}
