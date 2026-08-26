import { expect, type Page, type TestInfo, test } from "@playwright/test";

async function captureResponsiveEvidence(page: Page, testInfo: TestInfo, name: string) {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  const { devicePixelRatio, height } = await page.evaluate(() => ({
    devicePixelRatio: window.devicePixelRatio || 1,
    height: Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
    ),
  }));
  if (height * devicePixelRatio <= 28_000) {
    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: testInfo.outputPath(`${name}.png`),
    });
    return;
  }

  const maximumScroll = Math.max(0, height - viewport!.height);
  const positions = [...new Set([0, Math.round(maximumScroll / 2), maximumScroll])];

  for (let index = 0; index < positions.length; index += 1) {
    await page.evaluate((y) => window.scrollTo(0, y), positions[index]);
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    await page.screenshot({
      animations: "disabled",
      path: testInfo.outputPath(`${name}-${index + 1}.png`),
    });
  }
}

test("registra evidências estáveis da landing e da autenticação", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem("prismivo-locale", "pt-BR");
    localStorage.setItem("prismivo-motion-mode", "reduced");
    localStorage.setItem("prismivo-theme", "dark");
  });

  await page.goto("/");
  await expect(page.locator(".hero h1")).toBeVisible();
  await expect(page.locator(".kinetic-prism-hero svg")).toBeVisible();
  await captureResponsiveEvidence(page, testInfo, "landing-premium");

  await page.goto("/entrar");
  await expect(page.locator(".access-card")).toBeVisible();
  await captureResponsiveEvidence(page, testInfo, "autenticacao-premium");
});
