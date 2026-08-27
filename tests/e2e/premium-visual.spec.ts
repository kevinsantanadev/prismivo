import { expect, test } from "@playwright/test";

test("o hero mantém a prévia livre e o prisma permanece na seção de identidade", async ({ page }) => {
  await page.goto("/");

  const hero = page.locator(".hero");
  const prism = page.locator(".kinetic-prism-showcase");
  await expect(hero).toBeVisible();
  await expect(hero.locator(".kinetic-prism-scene")).toHaveCount(0);
  await expect(hero.locator(".dashboard-frame")).toBeVisible();
  await expect(prism).toBeVisible();
  await expect(prism.locator("svg.prism-svg")).toHaveCount(1);
  await expect(prism.locator("canvas")).toHaveCount(0);
  await expect(prism.locator(".prism-facet")).toHaveCount(7);
  await expect(prism.locator(".prism-star")).toHaveCount(8);
  await expect(prism.locator(".prism-vortex")).toHaveCount(1);

  const metrics = await prism.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      height: rect.height,
      right: rect.right,
      viewportWidth: document.documentElement.clientWidth,
      width: rect.width,
    };
  });
  expect(metrics.width).toBeGreaterThan(220);
  expect(metrics.height).toBeGreaterThan(250);
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth + 1);
});

test("a preferência interna de movimento reduz animações do prisma", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("prismivo-motion-mode", "reduced");
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");

  const motion = await page.locator(".kinetic-prism-showcase").evaluate((element) => ({
    crystal: getComputedStyle(element.querySelector(".prism-crystal")!).animationName,
    energy: getComputedStyle(element.querySelector(".prism-energy-line")!).animationName,
    object: getComputedStyle(element.querySelector(".kinetic-prism")!).animationName,
    particle: getComputedStyle(element.querySelector(".prism-particle")!).animationName,
    star: getComputedStyle(element.querySelector(".prism-star")!).animationName,
    vortex: getComputedStyle(element.querySelector(".prism-vortex")!).animationName,
  }));

  expect(motion).toEqual({
    crystal: "none",
    energy: "none",
    object: "none",
    particle: "none",
    star: "none",
    vortex: "none",
  });
});

test("temas público e interno continuam distintos e legíveis", async ({ page }) => {
  await page.goto("/");

  for (const theme of ["light", "dark", "mono"] as const) {
    await page.evaluate((selectedTheme) => {
      document.documentElement.dataset.theme = selectedTheme;
      document.documentElement.style.colorScheme = selectedTheme === "light" ? "light" : "dark";
    }, theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.locator(".hero h1")).toBeVisible();

    const palette = await page.locator(".site-shell").evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color };
    });
    expect(palette.background).not.toBe(palette.color);
  }
});
