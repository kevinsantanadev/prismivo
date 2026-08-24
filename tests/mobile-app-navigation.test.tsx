/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MobileAppNavigation } from "@/app/app/components/mobile-app-navigation";
import { getMobileNavigationCopy, type AppSection } from "@/lib/app-shell-i18n";

const sections: AppSection[] = [
  "dashboard",
  "tasks",
  "projects",
  "clients",
  "approvals",
  "files",
  "support",
  "content",
  "billing",
  "notifications",
  "team",
  "admin",
  "settings",
];

const items = sections.map((key) => ({
  key,
  href: key === "dashboard" ? "/app" : `/app/${key}`,
}));

afterEach(() => cleanup());

describe("mobile app navigation", () => {
  it("keeps four quick destinations and exposes every service in an accessible sheet", async () => {
    const user = userEvent.setup();
    const copy = getMobileNavigationCopy("pt-BR");
    render(
      <MobileAppNavigation
        active="dashboard"
        copy={copy}
        items={items}
        primarySections={["dashboard", "tasks", "projects", "clients"]}
      />,
    );

    const navigation = screen.getByRole("navigation", { name: copy.mobileNavigation });
    expect(navigation.querySelectorAll("a")).toHaveLength(4);
    const more = screen.getByRole("button", { name: copy.more });
    expect(more).toHaveAttribute("aria-expanded", "false");

    await user.click(more);
    const dialog = screen.getByRole("dialog", { name: copy.more });
    expect(dialog).toBeVisible();
    expect(dialog.querySelectorAll("nav a")).toHaveLength(sections.length);
    expect(document.body.style.overflow).toBe("hidden");
    await waitFor(() => expect(screen.getByRole("button", { name: copy.closeMenu })).toHaveFocus());

    await user.keyboard("{Escape}");
    expect(dialog).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(more).toHaveFocus();
  });

  it("marks Mais as active when the current area is outside the four shortcuts", () => {
    const copy = getMobileNavigationCopy("pt-BR");
    render(
      <MobileAppNavigation
        active="settings"
        copy={copy}
        items={items}
        primarySections={["dashboard", "tasks", "projects", "clients"]}
      />,
    );

    expect(screen.getByRole("button", { name: copy.more })).toHaveClass("active");
  });
});
