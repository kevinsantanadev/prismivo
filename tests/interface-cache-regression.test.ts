import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const serviceWorker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const globalStyles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

describe("interface asset cache safeguards", () => {
  it("never serves Next.js scripts or styles from the public service-worker cache", () => {
    expect(serviceWorker).toContain('"/_next"');
    expect(serviceWorker).toContain('request.destination === "image"');
    expect(serviceWorker).not.toMatch(/\[\s*"style"\s*,\s*"script"/);
  });

  it("suppresses the browser-native password reveal control", () => {
    expect(globalStyles).toContain(".password-input-wrap input::-ms-reveal");
    expect(globalStyles).toContain("display: none;");
  });
});
