import { describe, expect, it } from "vitest";
import { classifySignupError, createPasswordSchema } from "../lib/auth-password";

const messages = {
  tooShort: "too short",
  tooLong: "too long",
  lowercase: "lowercase",
  uppercase: "uppercase",
  number: "number",
  symbol: "symbol",
};

describe("password policy", () => {
  const schema = createPasswordSchema(messages);

  it("accepts eight characters with every required class", () => {
    expect(schema.safeParse("Prisma1!").success).toBe(true);
  });

  it.each(["Pri1!", "prisma1!", "PRISMA1!", "Prismivo!", "Prismivo1"])(
    "rejects an incomplete password policy: %s",
    (password) => expect(schema.safeParse(password).success).toBe(false),
  );
});

describe("signup error classification", () => {
  it("recognizes invalid SMTP credentials as an email outage", () => {
    expect(classifySignupError({ code: "unexpected_failure", status: 500, message: "535 Authentication credentials invalid" })).toBe("email-unavailable");
  });

  it("recognizes provider password and rate-limit failures", () => {
    expect(classifySignupError({ code: "weak_password", status: 422 })).toBe("weak-password");
    expect(classifySignupError({ code: "over_email_send_rate_limit", status: 429 })).toBe("rate-limit");
  });
});
