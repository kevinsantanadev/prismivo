import { expect, test } from "@playwright/test";

test("registra evidências estáveis da landing e da autenticação", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem("prismivo-locale", "pt-BR");
    localStorage.setItem("prismivo-motion-mode", "reduced");
    localStorage.setItem("prismivo-theme", "dark");
  });

  await page.goto("/");
  await expect(page.locator(".hero h1")).toBeVisible();
  await expect(page.locator(".kinetic-prism-hero svg")).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("landing-premium.png"),
  });

  await page.goto("/entrar");
  await expect(page.locator(".access-card")).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("autenticacao-premium.png"),
  });
});
