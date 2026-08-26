/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AgendaBoard } from "@/app/app/components/agenda-board";
import type { AgendaEvent } from "@/lib/marco23";

const events: AgendaEvent[] = [
  { id: "task:t1", sourceId: "t1", kind: "task", title: "Revisar contrato", context: "Aurora", clientName: "Orion", date: "2026-08-26", status: "todo", priority: "high", href: "/app/tarefas" },
  { id: "approval:a1", sourceId: "a1", kind: "approval", title: "Aprovar identidade", context: "Nebula", clientName: "Vega", date: "2026-09-03", status: "pending", priority: null, href: "/app/projetos/p1" },
];

afterEach(cleanup);

describe("Marco 23 unified agenda", () => {
  it("filters existing records without changing their navigation context", async () => {
    const user = userEvent.setup();
    render(<AgendaBoard events={events} locale="pt-BR" today="2026-08-26" />);

    expect(screen.getByText("Revisar contrato")).toBeVisible();
    expect(screen.getByText("Aprovar identidade")).toBeVisible();
    await user.selectOptions(screen.getByRole("combobox", { name: "Tipo" }), "approval");

    expect(screen.queryByText("Revisar contrato")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir contexto: Aprovar identidade" })).toHaveAttribute("href", "/app/projetos/p1");
  });

  it("shows a purposeful empty state when search has no matches", async () => {
    const user = userEvent.setup();
    render(<AgendaBoard events={events} locale="pt-BR" today="2026-08-26" />);
    await user.type(screen.getByRole("searchbox", { name: "Buscar na agenda" }), "inexistente");
    expect(screen.getByRole("heading", { name: "Agenda livre" })).toBeVisible();
  });
});
