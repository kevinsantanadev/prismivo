import { expect, test } from "@playwright/test";

const routes = ["/", "/cadastro", "/entrar", "/status"];

for (const width of [320, 360, 390, 412, 430]) {
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

test("rotas públicas críticas não falham silenciosamente na rede", async ({ page }) => {
  const failures: string[] = [];
  page.on("requestfailed", (request) => {
    const error = request.failure()?.errorText ?? "falha";
    const isCancelledPrefetch = error === "net::ERR_ABORTED" && request.url().includes("_rsc=");
    if (!isCancelledPrefetch) failures.push(`${request.method()} ${request.url()} — ${error}`);
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
