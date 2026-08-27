/** @vitest-environment jsdom */

import { cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskBoard } from "@/app/app/components/task-board";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

beforeEach(() => {
  refreshMock.mockReset();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: false })) });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("animated task board", () => {
  it("moves a task optimistically to the new column through a layout transition", async () => {
    const transition = vi.fn((callback: () => void) => callback());
    Object.defineProperty(document, "startViewTransition", { configurable: true, value: transition });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<TaskBoard locale="pt-BR" initialTasks={[{ id: "tsk_1", title: "Revisar entrega", description: "", status: "todo", priority: "medium", dueDate: null, projectName: "Aurora", clientName: "Cliente" }]} />);
    const todo = document.querySelector('[data-task-column="todo"]') as HTMLElement;
    const progress = document.querySelector('[data-task-column="in_progress"]') as HTMLElement;
    expect(within(todo).getByText("Revisar entrega")).toBeVisible();

    await user.selectOptions(screen.getByRole("combobox", { name: "Status da tarefa" }), "in_progress");

    expect(transition).toHaveBeenCalledOnce();
    expect(within(progress).getByText("Revisar entrega")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith("/api/tasks/tsk_1", expect.objectContaining({ method: "PATCH" }));
  });
});
