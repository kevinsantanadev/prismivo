"use client";

import { CheckCircle2, CircleDashed, TimerReset } from "lucide-react";
import { useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import { TaskStatusActions, type TaskStatus } from "./task-status-actions";

export type TaskBoardItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectName: string;
  clientName: string | null;
};

const columns: Array<{ status: TaskStatus; icon: typeof CircleDashed }> = [
  { status: "todo", icon: CircleDashed },
  { status: "in_progress", icon: TimerReset },
  { status: "done", icon: CheckCircle2 },
];

export function TaskBoard({ initialTasks, locale }: { initialTasks: TaskBoardItem[]; locale: SiteLocale }) {
  const router = useRouter();
  const copy = getOperationalCopy(locale).tasks;
  const [tasks, setTasks] = useState(initialTasks);
  const [pending, setPending] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  async function updateStatus(id: string, nextStatus: TaskStatus) {
    if (pending.includes(id)) return;
    const previousStatus = normalizeTaskStatus(tasks.find((task) => task.id === id)?.status);
    if (previousStatus === nextStatus) return;

    setPending((current) => [...current, id]);
    setMessage("");
    moveTask(id, nextStatus);

    try {
      const response = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json() as { ok: boolean; error?: { message?: string } };
      if (!response.ok || !result.ok) {
        moveTask(id, previousStatus);
        setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.status.error);
        return;
      }
      setMessage(copy.status.success);
      router.refresh();
    } catch {
      moveTask(id, previousStatus);
      setMessage(copy.status.connectionError);
    } finally {
      setPending((current) => current.filter((taskId) => taskId !== id));
    }
  }

  function moveTask(id: string, status: TaskStatus) {
    runLayoutTransition(() => {
      setTasks((current) => current.map((task) => task.id === id ? { ...task, status } : task));
    });
  }

  return (
    <>
      <section className="app-summary-strip task-live-summary" aria-label={copy.summaryAria}>
        {columns.map(({ status, icon: Icon }) => {
          const count = tasks.filter((task) => normalizeTaskStatus(task.status) === status).length;
          const label = status === "todo" ? copy.todoCount : status === "in_progress" ? copy.progressCount : copy.doneCount;
          return <article key={status}><Icon aria-hidden="true" /><span><strong>{count}</strong><small>{label}</small></span></article>;
        })}
      </section>
      {message && <p className="task-board-feedback" role="status">{message}</p>}
      <section className="task-board" aria-label={copy.boardAria}>
        {columns.map(({ status }) => {
          const items = tasks.filter((task) => normalizeTaskStatus(task.status) === status);
          const title = status === "todo" ? copy.columns.todo : status === "in_progress" ? copy.columns.inProgress : copy.columns.done;
          return (
            <section className="task-column" data-task-column={status} key={status}>
              <header><span className={`task-column-dot ${status}`} /><h2>{title}</h2><small>{items.length}</small></header>
              <div>{items.length === 0 ? <p className="column-empty">{copy.emptyColumn}</p> : items.map((task) => (
                <article
                  className={`task-card ${task.status}${pending.includes(task.id) ? " is-updating" : ""}`}
                  data-task-id={task.id}
                  key={task.id}
                  style={{ viewTransitionName: taskTransitionName(task.id) }}
                >
                  <span className={`priority-badge ${task.priority}`}>{priorityLabel(task.priority, locale)}</span>
                  <h3>{task.title}</h3>
                  <p>{task.description || getOperationalCopy(locale).common.noDescription}</p>
                  <div className="task-context"><span>{task.projectName}</span><small>{task.clientName || getOperationalCopy(locale).common.noClient}{task.dueDate ? ` · ${formatShortDate(task.dueDate, locale)}` : ""}</small></div>
                  <TaskStatusActions id={task.id} status={normalizeTaskStatus(task.status)} locale={locale} busy={pending.includes(task.id)} onStatusChange={(nextStatus) => updateStatus(task.id, nextStatus)} />
                </article>
              ))}</div>
            </section>
          );
        })}
      </section>
    </>
  );
}

function runLayoutTransition(update: () => void) {
  const transitionDocument = document as Document & {
    startViewTransition?: (callback: () => void) => unknown;
  };
  const reduced = document.documentElement.dataset.motion === "reduced"
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!transitionDocument.startViewTransition || reduced) {
    update();
    return;
  }
  transitionDocument.startViewTransition(() => flushSync(update));
}

function normalizeTaskStatus(status?: string): TaskStatus {
  return status === "in_progress" || status === "done" ? status : "todo";
}

function taskTransitionName(id: string) {
  return `task-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function priorityLabel(value: string, locale: SiteLocale) {
  const labels = getOperationalCopy(locale).tasks.priorities;
  return value === "high" ? labels.high : value === "low" ? labels.low : labels.medium;
}

function formatShortDate(value: string, locale: SiteLocale) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}
