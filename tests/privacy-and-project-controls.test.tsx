/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectForm } from "@/app/app/project-form";
import { ProjectLifecycleActions } from "@/app/app/components/project-lifecycle-actions";
import { TeamManager } from "@/app/app/components/team-manager";
import { AvatarUploader } from "@/app/app/components/avatar-uploader";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("privacy and project controls", () => {
  it("does not render personal member e-mails in the team roster", () => {
    render(<TeamManager locale="pt-BR" currentUserId="user_owner" currentRole="owner" invitations={[]} members={[
      { id: "mem_1", userId: "user_owner", name: "Kevin Reis", role: "owner", status: "active", joinedAt: "2026-08-01T00:00:00Z" },
      { id: "mem_2", userId: "user_editor", name: "Maria Silva", role: "editor", status: "active", joinedAt: "2026-08-02T00:00:00Z" },
    ]} />);
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(screen.getByText("Editor · Ativo")).toBeVisible();
  });

  it("disables project creation and explains how to free a plan slot", () => {
    render(<ProjectForm locale="pt-BR" activeProjects={3} projectLimit={3} />);
    expect(screen.getByRole("button", { name: "Novo projeto" })).toBeDisabled();
    expect(screen.getByText("Limite do plano atingido. Arquive um projeto para liberar espaço.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Gerenciar projetos" })).toHaveAttribute("href", "/app/projetos");
  });

  it("archives through the protected lifecycle endpoint and only offers deletion after archive", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const { rerender } = render(<ProjectLifecycleActions id="prj_1" name="Aurora" status="active" canDelete locale="pt-BR" />);

    expect(screen.queryByRole("button", { name: "Excluir definitivamente" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Arquivar" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/projects/prj_1", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ action: "archive" }) })));

    rerender(<ProjectLifecycleActions id="prj_1" name="Aurora" status="archived" canDelete locale="pt-BR" />);
    expect(screen.getByRole("button", { name: "Restaurar" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Excluir definitivamente" })).toBeVisible();
  });

  it("renders the private same-origin avatar endpoint as an image", () => {
    render(<AvatarUploader initialUrl="/api/profile/avatar?v=1" name="Kevin Reis" locale="pt-BR" />);
    const image = screen.getByRole("img", { name: "Foto de Kevin Reis" });
    expect(image).toHaveAttribute("src", "https://prismivo.test/api/profile/avatar?v=1");
    fireEvent.error(image);
    expect(screen.getByText("KR")).toBeVisible();
    expect(screen.getByText("A foto salva não pôde ser carregada. Tente enviá-la novamente.")).toBeVisible();
  });
});
