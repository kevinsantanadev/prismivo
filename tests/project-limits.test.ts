import { describe, expect, it } from "vitest";
import { activeProjectLimitForPlan, isActiveProjectLimitReached, normalizeActiveProjectLimit } from "@/lib/project-limits";

describe("active project limits", () => {
  it("uses the configured capacity for every commercial plan", () => {
    expect(activeProjectLimitForPlan("free")).toBe(3);
    expect(activeProjectLimitForPlan("professional")).toBe(50);
    expect(activeProjectLimitForPlan("scale")).toBeNull();
  });

  it("treats the database -1 convention as unlimited", () => {
    expect(normalizeActiveProjectLimit(-1, "free")).toBeNull();
    expect(normalizeActiveProjectLimit("12", "free")).toBe(12);
    expect(normalizeActiveProjectLimit(undefined, "professional")).toBe(50);
  });

  it("blocks only finite plans that have reached their active capacity", () => {
    expect(isActiveProjectLimitReached(3, 3)).toBe(true);
    expect(isActiveProjectLimitReached(2, 3)).toBe(false);
    expect(isActiveProjectLimitReached(500, null)).toBe(false);
  });
});
