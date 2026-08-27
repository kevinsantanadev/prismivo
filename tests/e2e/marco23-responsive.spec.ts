import { expect, test } from "@playwright/test";

test("Marco 23 keeps agenda and routines usable across the phone matrix", async ({ page }) => {
  for (const width of [320, 360, 375, 390, 393, 412, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    await page.evaluate(() => {
      document.body.innerHTML = `
        <main class="app-content">
          <section class="dashboard-panel agenda-board">
            <div class="agenda-toolbar"><div><h2>Agenda</h2></div><div class="agenda-filters"><label class="app-search agenda-search"><input aria-label="Busca"></label><label class="agenda-select"><select aria-label="Tipo"><option>Todos</option></select></label><label class="agenda-month"><input type="month" aria-label="Mês"><button>Todos os meses</button></label></div></div>
            <div class="agenda-groups"><section class="agenda-group today"><header><span></span><h3>Hoje</h3><small>1</small></header><div><article class="agenda-row kind-task"><time><strong>26</strong><span>ago</span></time><span class="agenda-kind">Tarefa</span><div class="agenda-row-copy"><h4>Revisar contrato importante</h4><p>Projeto Aurora · Cliente Orion</p></div><a href="#">Abrir</a></article></div></section></div>
          </section>
          <section class="routines-layout"><article class="dashboard-panel routine-rules"><div class="routine-rule-list"><article class="enabled"><button class="routine-toggle"><span></span><strong>Ativa</strong></button><div><h3>Tarefas próximas</h3><p>Destaca tarefas abertas antes do prazo.</p></div><label><span>Antecedência</span><select><option>3 dias</option></select></label></article></div></article></section>
        </main>`;
    });

    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      input: document.querySelector<HTMLInputElement>(".agenda-search input")?.getBoundingClientRect().height ?? 0,
      select: document.querySelector<HTMLSelectElement>(".agenda-select select")?.getBoundingClientRect().height ?? 0,
    }));
    expect(metrics.overflow, `overflow at ${width}px`).toBeLessThanOrEqual(1);
    expect(metrics.input, `search target at ${width}px`).toBeGreaterThanOrEqual(40);
    expect(metrics.select, `filter target at ${width}px`).toBeGreaterThanOrEqual(40);
    await expect(page.locator(".agenda-row")).toBeVisible();
    await expect(page.locator(".routine-rule-list article")).toBeVisible();
  }
});

test("the overview compacts a remaining widget instead of leaving an empty column", async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    await page.evaluate(() => {
      document.body.innerHTML = `<main class="app-content"><section class="dashboard-widget-layout"><div class="dashboard-widget-slot widget-pulse"><article class="dashboard-panel"><h2>Saúde da operação</h2><p>Conteúdo operacional</p></article></div></section></main>`;
    });

    const layout = page.locator(".dashboard-widget-layout");
    const widget = page.locator(".widget-pulse");
    await expect(layout).toBeVisible();
    await expect(widget).toBeVisible();

    const [layoutBox, widgetBox, overflow] = await Promise.all([
      layout.boundingBox(),
      widget.boundingBox(),
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    ]);
    if (!layoutBox || !widgetBox) {
      throw new Error(`dashboard widget geometry unavailable at ${width}px`);
    }
    expect(widgetBox.x - layoutBox.x, `widget left gap at ${width}px`).toBeLessThanOrEqual(1);
    expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(1);
  }
});
