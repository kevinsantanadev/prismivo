import { expect, type Page, type TestInfo, test } from "@playwright/test";

async function captureFullPageInSafeSegments(page: Page, testInfo: TestInfo, name: string) {
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
  const maximumSegmentHeight = Math.max(viewport!.height, Math.floor(28_000 / devicePixelRatio));
  const segmentCount = Math.ceil(height / maximumSegmentHeight);

  for (let index = 0; index < segmentCount; index += 1) {
    const y = index * maximumSegmentHeight;
    const segmentHeight = Math.min(maximumSegmentHeight, height - y);
    const suffix = segmentCount === 1 ? "" : `-${index + 1}`;
    await page.screenshot({
      animations: "disabled",
      clip: { x: 0, y, width: viewport!.width, height: segmentHeight },
      path: testInfo.outputPath(`${name}${suffix}.png`),
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
  await captureFullPageInSafeSegments(page, testInfo, "landing-premium");

  await page.goto("/entrar");
  await expect(page.locator(".access-card")).toBeVisible();
  await captureFullPageInSafeSegments(page, testInfo, "autenticacao-premium");
});
