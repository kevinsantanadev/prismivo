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

for (const theme of ["dark", "mono"] as const) {
  test(`rotas públicas preservam contraste WCAG no tema ${theme}`, async ({ page }) => {
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("prismivo-theme", selectedTheme);
    }, theme);

    for (const [name, route] of publicRoutes) {
      await page.goto(route);
      await expect(page.locator("main"), `${name} sem conteúdo no tema ${theme}`).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      expect(results.violations, `${name} / ${theme}\n${JSON.stringify(results.violations, null, 2)}`).toEqual([]);
    }
  });
}
