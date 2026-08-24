/** @vitest-environment jsdom */

import { cleanup, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspacePreferencesSync } from "@/app/app/components/workspace-preferences-sync";
import { SitePreferencesProvider } from "@/app/components/site-preferences";

beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("saved workspace preferences", () => {
  it("wins over stale device preferences during hydration", async () => {
    window.localStorage.setItem("prismivo-theme", "dark");
    window.localStorage.setItem("prismivo-sidebar-mode", "brand");
    window.localStorage.setItem("prismivo-interface-density", "compact");

    render(
      <SitePreferencesProvider>
        <WorkspacePreferencesSync
          locale="pt-BR"
          theme="light"
          accentColor="teal"
          interfaceFilter="crisp"
          colorVisionMode="standard"
          sidebarMode="adaptive"
          interfaceDensity="comfortable"
          contentWidth="wide"
          cornerStyle="soft"
          textScale="large"
          motionMode="reduced"
        />
      </SitePreferencesProvider>,
    );

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    expect(document.documentElement.dataset.sidebarMode).toBe("adaptive");
    expect(document.documentElement.dataset.interfaceDensity).toBe("comfortable");
    expect(document.documentElement.dataset.contentWidth).toBe("wide");
    expect(document.documentElement.dataset.cornerStyle).toBe("soft");
    expect(document.documentElement.dataset.textScale).toBe("large");
    expect(document.documentElement.dataset.motion).toBe("reduced");
    expect(window.localStorage.getItem("prismivo-sidebar-mode")).toBe("adaptive");
  });

  it("keeps device preferences on public pages without a workspace", async () => {
    window.localStorage.setItem("prismivo-theme", "dark");
    window.localStorage.setItem("prismivo-sidebar-mode", "dark");

    render(<SitePreferencesProvider><span>Prismivo</span></SitePreferencesProvider>);

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    expect(document.documentElement.dataset.sidebarMode).toBe("dark");
  });
});
