import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicRoutes = [
  ["início", "/"],
  ["cadastro", "/cadastro"],
  ["entrada", "/entrar"],
  ["recuperação", "/recuperar-senha"],
  ["status", "/status"],
] as const;

for (const [name, route] of publicRoutes) {
  test(`${name} atende aos gates WCAG automatizáveis`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
