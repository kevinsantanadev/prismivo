import { expect, test } from "@playwright/test";

test("preferências avançadas entram antes da hidratação", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("prismivo-theme", "light");
    localStorage.setItem("prismivo-sidebar-mode", "brand");
    localStorage.setItem("prismivo-interface-density", "compact");
    localStorage.setItem("prismivo-content-width", "focused");
    localStorage.setItem("prismivo-corner-style", "square");
    localStorage.setItem("prismivo-text-scale", "large");
    localStorage.setItem("prismivo-motion-mode", "reduced");
  });

  await page.goto("/");
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(root).toHaveAttribute("data-sidebar-mode", "brand");
  await expect(root).toHaveAttribute("data-interface-density", "compact");
  await expect(root).toHaveAttribute("data-content-width", "focused");
  await expect(root).toHaveAttribute("data-corner-style", "square");
  await expect(root).toHaveAttribute("data-text-scale", "large");
  await expect(root).toHaveAttribute("data-motion", "reduced");
});

test("barra lateral adaptável acompanha o tema e respeita escolhas explícitas", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    document.body.innerHTML = '<div class="app-layout"><aside class="app-sidebar"><nav><a class="active">Visão geral</a></nav></aside><main class="app-content"><section class="dashboard-panel">Conteúdo</section></main></div>';
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.sidebarMode = "adaptive";
  });

  const sidebar = page.locator(".app-sidebar");
  await expect.poll(() => sidebar.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(248, 250, 245)");

  await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
  await expect.poll(() => sidebar.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(17, 21, 18)");

  await page.evaluate(() => { document.documentElement.dataset.sidebarMode = "light"; });
  await expect.poll(() => sidebar.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(248, 250, 245)");
});

test("largura, densidade e cantos alteram o layout sem overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  await page.evaluate(() => {
    document.body.innerHTML = '<div class="app-layout"><aside class="app-sidebar"><nav><a>Projetos</a></nav></aside><main class="app-content"><section class="dashboard-panel">Conteúdo</section></main></div>';
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.sidebarMode = "adaptive";
    document.documentElement.dataset.contentWidth = "focused";
    document.documentElement.dataset.interfaceDensity = "compact";
    document.documentElement.dataset.cornerStyle = "square";
  });

  const focusedWidth = await page.locator(".app-content").evaluate((element) => element.getBoundingClientRect().width);
  expect(focusedWidth).toBeLessThanOrEqual(1080.5);
  await expect(page.locator(".dashboard-panel")).toHaveCSS("border-radius", "4px");
  await expect(page.locator(".app-sidebar nav a")).toHaveCSS("min-height", "38px");

  await page.evaluate(() => {
    document.documentElement.dataset.contentWidth = "wide";
    document.documentElement.dataset.interfaceDensity = "spacious";
    document.documentElement.dataset.cornerStyle = "rounded";
  });
  const wideWidth = await page.locator(".app-content").evaluate((element) => element.getBoundingClientRect().width);
  expect(wideWidth).toBeGreaterThan(focusedWidth + 500);
  await expect(page.locator(".dashboard-panel")).toHaveCSS("border-radius", "18px");
  await expect(page.locator(".app-sidebar nav a")).toHaveCSS("min-height", "50px");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("personalização permanece utilizável na matriz de celulares", async ({ page }) => {
  for (const width of [320, 360, 390, 412, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div class="app-layout">
          <aside class="app-sidebar"><nav><a>Configurações</a></nav></aside>
          <div class="app-workspace">
            <main class="app-content">
              <form class="settings-form">
                <section class="dashboard-panel settings-section">
                  <div class="form-row">
                    <div class="form-field"><label for="mobile-theme">Tema</label><select id="mobile-theme"><option>Claro</option></select></div>
                    <div class="form-field"><label for="mobile-sidebar">Barra lateral</label><select id="mobile-sidebar"><option>Adaptável</option></select></div>
                  </div>
                  <div class="interface-preview"><div class="interface-preview-sidebar"><span></span></div><div class="interface-preview-main"><header>Prévia</header><div><span></span><span></span><span></span></div></div></div>
                  <div class="quick-navigation-preview"><span><strong>1</strong>Visão geral</span><span><strong>2</strong>Tarefas</span><span><strong>3</strong>Projetos</span><span><strong>4</strong>Clientes</span></div>
                </section>
              </form>
            </main>
          </div>
        </div>`;
      document.documentElement.dataset.theme = "light";
      document.documentElement.dataset.sidebarMode = "adaptive";
    });

    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      selectHeight: document.querySelector("select")?.getBoundingClientRect().height ?? 0,
    }));
    expect(metrics.overflow, `overflow at ${width}px`).toBeLessThanOrEqual(1);
    expect(metrics.selectHeight, `touch target at ${width}px`).toBeGreaterThanOrEqual(44);
    await expect(page.locator(".app-sidebar")).toBeHidden();
    await expect(page.locator(".interface-preview")).toBeVisible();
  }
});
