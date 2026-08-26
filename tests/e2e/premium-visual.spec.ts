import { expect, test } from "@playwright/test";

test("o prisma premium é vetorial, visível e não cria uma dependência de canvas", async ({ page }) => {
  await page.goto("/");

  const hero = page.locator(".hero");
  const prism = hero.locator(".kinetic-prism-hero");
  await expect(hero).toBeVisible();
  await expect(prism).toBeVisible();
  await expect(prism.locator("svg.prism-svg")).toHaveCount(1);
  await expect(prism.locator("canvas")).toHaveCount(0);
  await expect(prism.locator(".prism-facet")).toHaveCount(7);

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

  const motion = await page.locator(".kinetic-prism-hero").evaluate((element) => ({
    crystal: getComputedStyle(element.querySelector(".prism-crystal")!).animationName,
    object: getComputedStyle(element.querySelector(".kinetic-prism")!).animationName,
    particle: getComputedStyle(element.querySelector(".prism-particle")!).animationName,
  }));

  expect(motion).toEqual({ crystal: "none", object: "none", particle: "none" });
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
