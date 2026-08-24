import { describe, expect, it } from "vitest";
import { appShellCopy, getMobileNavigationCopy } from "../lib/app-shell-i18n";
import { supportedLocales } from "../lib/site-locale";

function containsFunction(value: unknown): boolean {
  if (typeof value === "function") return true;
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some(containsFunction);
}

describe("fronteira serializável do painel autenticado", () => {
  it.each(supportedLocales)("envia somente textos para a navegação móvel em %s", (locale) => {
    const mobileCopy = getMobileNavigationCopy(locale);

    expect(containsFunction(appShellCopy[locale])).toBe(true);
    expect(containsFunction(mobileCopy)).toBe(false);
    expect(() => structuredClone(mobileCopy)).not.toThrow();
    expect(Object.keys(mobileCopy)).toEqual([
      "mobileNavigation",
      "more",
      "closeMenu",
      "logout",
      "nav",
    ]);
  });
});
