import { describe, expect, it } from "vitest";
import {
  confirmationDestination,
  parseEmailOtpType,
} from "../lib/auth-confirmation";

describe("email confirmation input", () => {
  it("accepts only the confirmation flows used by Prismivo", () => {
    expect(parseEmailOtpType("email")).toBe("email");
    expect(parseEmailOtpType("recovery")).toBe("recovery");
    expect(parseEmailOtpType("invite")).toBeNull();
    expect(parseEmailOtpType(null)).toBeNull();
  });

  it("selects the correct default after token verification", () => {
    expect(confirmationDestination(null, "https://prismivo.example", "email"))
      .toBe("/app/onboarding");
    expect(confirmationDestination(null, "https://prismivo.example", "recovery"))
      .toBe("/redefinir-senha");
  });

  it("accepts same-origin paths and rejects external or reserved destinations", () => {
    expect(confirmationDestination(
      "https://prismivo.example/app/onboarding?from=email",
      "https://prismivo.example",
      "email",
    )).toBe("/app/onboarding?from=email");
    expect(confirmationDestination(
      "https://attacker.example/capture",
      "https://prismivo.example",
      "email",
    )).toBe("/app/onboarding");
    expect(confirmationDestination(
      "/auth/callback?next=/app",
      "https://prismivo.example",
      "recovery",
    )).toBe("/redefinir-senha");
  });
});
