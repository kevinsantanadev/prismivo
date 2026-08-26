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
