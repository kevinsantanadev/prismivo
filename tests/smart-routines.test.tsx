/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SmartRoutines } from "@/app/app/components/smart-routines";
import type { AgendaEvent } from "@/lib/marco23";

const events: AgendaEvent[] = [
  {
    id: "task:t1",
    sourceId: "t1",
    kind: "task",
    title: "Revisar contrato",
    context: "Projeto Aurora",
    clientName: "Orion",
    date: "2026-08-27",
    status: "todo",
    priority: "high",
    href: "/app/tarefas",
  },
];

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("Marco 23 smart routines", () => {
  it("keeps rule edits as a draft until the explicit save", async () => {
    const user = userEvent.setup();
    render(<SmartRoutines events={events} locale="pt-BR" today="2026-08-26" />);

    expect(screen.getByText("Revisar contrato")).toBeVisible();
    await user.click(screen.getByRole("switch", { name: /Tarefas próximas/ }));
    expect(screen.getByText("Revisar contrato")).toBeVisible();
    expect(window.localStorage.getItem("prismivo:marco23:smart-routines")).toBeNull();

    await user.click(screen.getByRole("button", { name: /Salvar rotinas/ }));
    expect(screen.queryByText("Revisar contrato")).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("prismivo:marco23:smart-routines") ?? "{}").task.enabled).toBe(false);
  });

  it("falls back safely when the stored preference is malformed", () => {
    window.localStorage.setItem("prismivo:marco23:smart-routines", "{invalid");
    render(<SmartRoutines events={events} locale="pt-BR" today="2026-08-26" />);
    expect(screen.getByText("Revisar contrato")).toBeVisible();
  });
});
