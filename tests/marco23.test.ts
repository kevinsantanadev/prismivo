import { describe, expect, it } from "vitest";
import {
  buildAgendaEvents,
  calculateOperationScore,
  classifyAgendaDate,
  defaultSmartRoutines,
  deriveClientInsights,
  getSmartAlerts,
  summarizeAgenda,
} from "@/lib/marco23";

describe("Marco 23 operational intelligence", () => {
  const events = buildAgendaEvents({
    tasks: [
      { id: "t1", title: "Enviar proposta", dueDate: "2026-08-25", status: "todo", priority: "high", projectName: "Aurora", clientName: "Orion" },
      { id: "t2", title: "Concluída", dueDate: "2026-08-20", status: "done", priority: "low", projectName: "Aurora", clientName: "Orion" },
    ],
    approvals: [
      { id: "a1", title: "Aprovar identidade", dueDate: "2026-08-26", status: "pending", projectId: "p1", projectName: "Aurora", clientName: "Orion" },
      { id: "a2", title: "Já aprovada", dueDate: "2026-08-26", status: "approved", projectId: "p1", projectName: "Aurora", clientName: "Orion" },
    ],
    projects: [
      { id: "p1", name: "Aurora", dueDate: "2026-09-01", status: "active", clientName: "Orion" },
      { id: "p2", name: "Finalizado", dueDate: "2026-08-22", status: "completed", clientName: null },
    ],
  });

  it("combines only actionable records into a chronological timeline", () => {
    expect(events.map((event) => event.id)).toEqual(["task:t1", "approval:a1", "project:p1"]);
    expect(events[1]).toMatchObject({ kind: "approval", href: "/app/projetos/p1" });
  });

  it("classifies and summarizes deadlines deterministically", () => {
    expect(classifyAgendaDate("2026-08-25", "2026-08-26")).toBe("overdue");
    expect(classifyAgendaDate("2026-08-26", "2026-08-26")).toBe("today");
    expect(classifyAgendaDate("2026-09-01", "2026-08-26")).toBe("next");
    expect(summarizeAgenda(events, "2026-08-26")).toEqual({ total: 3, overdue: 1, today: 1, next: 1, later: 0 });
  });

  it("derives CRM health from linked projects without mutating clients", () => {
    const clients = [{ id: "c1", status: "active" }, { id: "c2", status: "active" }];
    const projects = [
      { clientId: "c1", status: "active", progress: 20, dueDate: "2026-08-20" },
      { clientId: "c1", status: "completed", progress: 100, dueDate: "2026-08-10" },
    ];
    const insights = deriveClientInsights(clients, projects, "2026-08-26");
    expect(insights[0]).toMatchObject({ health: "attention", overdueProjects: 1, activeProjects: 1, averageProgress: 60 });
    expect(insights[1]).toMatchObject({ health: "inactive", activeProjects: 0 });
  });

  it("generates local smart alerts according to saved lead time", () => {
    const alerts = getSmartAlerts(events, defaultSmartRoutines, "2026-08-26");
    expect(alerts.map((event) => event.kind)).toEqual(["task", "approval", "project"]);
    const paused = getSmartAlerts(events, { ...defaultSmartRoutines, task: { enabled: false, leadDays: 3 } }, "2026-08-26");
    expect(paused.some((event) => event.kind === "task")).toBe(false);
  });

  it("keeps the operational score inside its safety range", () => {
    expect(calculateOperationScore({ overdue: 0, dueToday: 0, activeProjects: 2, pendingApprovals: 0 })).toBe(96);
    expect(calculateOperationScore({ overdue: 20, dueToday: 10, activeProjects: 0, pendingApprovals: 10 })).toBe(24);
  });
});
