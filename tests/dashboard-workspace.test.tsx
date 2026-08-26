/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DashboardWorkspace } from "@/app/app/components/dashboard-workspace";

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("Marco 23 dashboard personalization", () => {
  it("keeps widget changes as draft until the explicit save", async () => {
    const user = userEvent.setup();
    render(<DashboardWorkspace locale="pt-BR" widgets={{
      metrics: <div>widget-metrics</div>,
      agenda: <div>widget-agenda</div>,
      projects: <div>widget-projects</div>,
      pulse: <div>widget-pulse</div>,
      activity: <div>widget-activity</div>,
      notifications: <div>widget-notifications</div>,
    }} />);

    expect(screen.getByText("widget-activity")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Personalizar painel" }));
    await user.click(screen.getByRole("button", { name: /Atividade recente/ }));
    expect(screen.getByText("widget-activity")).toBeVisible();
    expect(window.localStorage.getItem("prismivo:marco23:dashboard-widgets")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Salvar painel" }));
    expect(screen.queryByText("widget-activity")).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("prismivo:marco23:dashboard-widgets") ?? "[]")).not.toContain("activity");
  });
});
