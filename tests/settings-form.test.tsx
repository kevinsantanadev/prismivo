/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SitePreferencesProvider } from "@/app/components/site-preferences";
import { SettingsForm } from "@/app/app/components/settings-form";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const profile = {
  bio: "",
  jobTitle: "",
  phone: "",
  location: "",
  website: "",
  theme: "dark",
  accentColor: "lime",
  interfaceFilter: "none",
  colorVisionMode: "standard",
  organizationBrandColor: "lime",
  organizationVisualStyle: "prism",
};

function renderSettings() {
  return render(
    <SitePreferencesProvider>
      <SettingsForm
        requestLocale="pt-BR"
        name="Kevin Santana"
        email="kevin@example.test"
        locale="pt-BR"
        organizationName="Prismivo Lab"
        canEditOrganization
        profile={profile}
      />
    </SitePreferencesProvider>,
  );
}

beforeEach(() => {
  refreshMock.mockReset();
  window.localStorage.clear();
  window.localStorage.setItem("prismivo-theme", "dark");
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

describe("settings preference transaction", () => {
  it("keeps appearance changes as drafts until the API confirms the save", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: { updated: true } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await user.selectOptions(screen.getByLabelText("Tema da conta"), "light");

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("prismivo-theme")).toBe("dark");
    expect(screen.getByText("Alterações pendentes — salve para aplicá-las.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    expect(window.localStorage.getItem("prismivo-theme")).toBe("light");
    expect(refreshMock).toHaveBeenCalledOnce();
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({ theme: "light", locale: "pt-BR" });
  });

  it("does not apply a rejected preference update", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: { message: "Não foi possível salvar." } }),
    }));
    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await user.selectOptions(screen.getByLabelText("Tema da conta"), "light");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await screen.findByText("Não foi possível salvar.");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("prismivo-theme")).toBe("dark");
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("restores the saved draft without issuing a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderSettings();

    const theme = screen.getByLabelText("Tema da conta") as HTMLSelectElement;
    await user.selectOptions(theme, "light");
    expect(theme.value).toBe("light");

    await user.click(screen.getByRole("button", { name: "Descartar alterações" }));
    expect(theme.value).toBe("dark");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
  });

  it("marks regular profile edits as pending", async () => {
    renderSettings();
    fireEvent.change(screen.getByLabelText("Cargo ou especialidade"), { target: { value: "Founder" } });
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeEnabled();
  });
});
