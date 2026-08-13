import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();

vi.mock("../lib/supabase/config", () => ({
  isSupabaseConfigured: () => true,
}));

vi.mock("../lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ rpc }),
}));

import { consumeRateLimit } from "../lib/rate-limit";

describe("authentication rate limit", () => {
  beforeEach(() => {
    rpc.mockReset();
    process.env.RATE_LIMIT_PEPPER = "segredo-de-teste-com-pelo-menos-trinta-e-dois-caracteres";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("allows the first signup attempt without an administrative key", async () => {
    rpc.mockResolvedValue({
      data: { allowed: true, remaining: 3, resetAt: "2026-08-13T15:00:00.000Z" },
      error: null,
    });

    const result = await consumeRateLimit("auth.signup", "pessoa@example.test|203.0.113.10");

    expect(result).toEqual({
      allowed: true,
      status: "allowed",
      remaining: 3,
      resetAt: "2026-08-13T15:00:00.000Z",
    });
    expect(rpc).toHaveBeenCalledWith("consume_rate_limit", {
      target_bucket: "auth.signup",
      target_subject_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });

  it("distinguishes a real limit from an unavailable limiter", async () => {
    rpc.mockResolvedValueOnce({ data: { allowed: false, remaining: 0, resetAt: null }, error: null });
    await expect(consumeRateLimit("auth.signup", "limit@example.test|203.0.113.11")).resolves.toMatchObject({
      allowed: false,
      status: "limited",
    });

    rpc.mockResolvedValueOnce({ data: null, error: { message: "unavailable" } });
    await expect(consumeRateLimit("auth.signup", "error@example.test|203.0.113.12")).resolves.toMatchObject({
      allowed: false,
      status: "unavailable",
    });
  });
});
