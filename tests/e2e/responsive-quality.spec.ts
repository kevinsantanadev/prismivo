import { expect, test } from "@playwright/test";

const routes = ["/", "/cadastro", "/entrar", "/status"];

for (const width of [320, 360, 375, 390, 393, 412, 430]) {
  test(`rotas públicas permanecem íntegras em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const quality = await page.evaluate(() => {
        const root = document.documentElement;
        const fields = Array.from(document.querySelectorAll<HTMLElement>("input, select, textarea"))
          .filter((element) => element.getClientRects().length > 0)
          .map((element) => Number.parseFloat(getComputedStyle(element).fontSize));
        return {
          horizontalOverflow: root.scrollWidth - root.clientWidth,
          bodyTextLength: document.body.innerText.trim().length,
          smallestFieldFont: fields.length ? Math.min(...fields) : 16,
        };
      });

      expect(quality.horizontalOverflow, `${route} criou rolagem horizontal`).toBeLessThanOrEqual(1);
      expect(quality.bodyTextLength, `${route} ficou sem conteúdo`).toBeGreaterThan(80);
      expect(quality.smallestFieldFont, `${route} pode acionar zoom automático no iOS`).toBeGreaterThanOrEqual(16);
    }
  });
}

test("landing e autenticação preservam a composição em tablets e desktops", async ({ page }) => {
  const viewports = [
    { width: 768, height: 1024 },
    { width: 820, height: 1180 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const route of ["/", "/entrar"] as const) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const quality = await page.evaluate(() => ({
        clippedInteractiveElements: Array.from(document.querySelectorAll<HTMLElement>("a, button, input, select, textarea"))
          .filter((element) => element.getClientRects().length > 0)
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.left < -1 || rect.right > document.documentElement.clientWidth + 1;
          }).length,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));

      expect(quality.horizontalOverflow, `${route} criou overflow em ${viewport.width}px`).toBeLessThanOrEqual(1);
      expect(quality.clippedInteractiveElements, `${route} cortou controles em ${viewport.width}px`).toBe(0);
    }
  }
});

test("rotas públicas críticas não falham silenciosamente na rede", async ({ page }) => {
  const failures: string[] = [];
  page.on("requestfailed", (request) => {
    const error = request.failure()?.errorText ?? "falha";
    const isNavigationCancellation = /(?:net::ERR_ABORTED|Load request cancelled)/i.test(error)
      && (request.url().includes("_rsc=") || request.url().endsWith("/sw.js"));
    if (!isNavigationCancellation) failures.push(`${request.method()} ${request.url()} — ${error}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 500) failures.push(`${response.status()} ${response.url()}`);
  });

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
  }

  expect(failures).toEqual([]);
});
