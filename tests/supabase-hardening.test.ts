import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260827220328_protect_team_member_emails.sql", import.meta.url), "utf8");

describe("Supabase privacy and plan hardening", () => {
  it("masks another member's personal e-mail in the roster RPC", () => {
    expect(migration).toContain("membership.user_id = (select auth.uid()) then profile.email else null::text");
  });

  it("enforces active project capacity inside the database", () => {
    expect(migration).toContain("projects_active_limit_guard");
    expect(migration).toContain("for update of organization");
    expect(migration).toContain("raise exception 'PLAN_LIMIT_REACHED'");
  });

  it("restricts irreversible project deletion to administrators", () => {
    expect(migration).toContain("create policy projects_admin_delete");
    expect(migration).toContain("array['owner', 'admin']");
  });
});
