import { expect, test, type Page } from "@playwright/test";

const publicMobileRoutes = [
  "/",
  "/entrar",
  "/cadastro",
  "/recuperar-senha",
  "/redefinir-senha",
  "/reenviar-confirmacao",
  "/status",
  "/conteudo",
  "/offline",
] as const;

test("rotas essenciais respeitam o viewport móvel real", async ({ page }) => {
  const failures: string[] = [];
  page.on("requestfailed", (request) => {
    const error = request.failure()?.errorText ?? "falha";
    const isNavigationCancellation = error === "net::ERR_ABORTED" || error === "Load request cancelled";
    if (!isNavigationCancellation) failures.push(`${request.method()} ${request.url()} — ${error}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 500) failures.push(`${response.status()} ${response.url()}`);
  });

  for (const route of publicMobileRoutes) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    const audit = await auditViewport(page);

    expect(audit.viewportMeta, `${route} não declarou viewport móvel`).toContain("width=device-width");
    expect(audit.bodyTextLength, `${route} ficou sem conteúdo`).toBeGreaterThan(50);
    expect(audit.horizontalOverflow, `${route} criou rolagem horizontal`).toBeLessThanOrEqual(1);
    expect(audit.clippedControls, `${route} cortou controles: ${audit.clippedControls.join(", ")}`).toEqual([]);
    expect(audit.smallestFieldFont, `${route} pode acionar zoom automático no iOS`).toBeGreaterThanOrEqual(16);
  }

  expect(failures).toEqual([]);
});

test("menus, preferências e formulários continuam utilizáveis com pouco espaço", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  const mobileMenu = page.getByRole("navigation", { name: "Navegação móvel" });
  await expect(mobileMenu).toBeVisible();
  expect((await auditViewport(page)).horizontalOverflow).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Fechar menu" }).click();

  await page.getByRole("button", { name: "Preferências de aparência e idioma" }).click();
  const preferences = page.getByRole("dialog", { name: "Preferências de aparência e idioma" });
  await expect(preferences).toBeVisible();
  const dialogBounds = await preferences.boundingBox();
  const viewport = page.viewportSize();
  expect(dialogBounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(dialogBounds!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBounds!.x + dialogBounds!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(dialogBounds!.y).toBeGreaterThanOrEqual(0);
  expect(dialogBounds!.y + dialogBounds!.height).toBeLessThanOrEqual(viewport!.height + 1);
  await page.getByRole("button", { name: "Fechar preferências" }).click();

  await page.goto("/cadastro");
  const fields = page.locator("input:visible");
  await expect(fields).toHaveCount(4);
  for (let index = 0; index < await fields.count(); index += 1) {
    const field = fields.nth(index);
    await field.focus();
    await field.scrollIntoViewIfNeeded();
    const metrics = await field.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        bottom: rect.bottom,
        fontSize: Number.parseFloat(style.fontSize),
        height: rect.height,
        top: rect.top,
      };
    });
    expect(metrics.top).toBeGreaterThanOrEqual(-1);
    expect(metrics.bottom).toBeLessThanOrEqual(viewport!.height + 1);
    expect(metrics.fontSize).toBeGreaterThanOrEqual(16);
    expect(metrics.height).toBeGreaterThanOrEqual(44);
  }
});

test("superfícies internas permanecem legíveis sem expor uma rota de teste", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
  await page.evaluate((fixture) => {
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.textScale = "extra-large";
    document.documentElement.dataset.sidebarMode = "adaptive";
    document.body.innerHTML = fixture;
  }, authenticatedMobileFixture);

  await expect(page.locator(".app-sidebar")).toBeHidden();
  await expect(page.locator(".mobile-app-navigation")).toBeVisible();
  const audit = await auditViewport(page);
  expect(audit.horizontalOverflow).toBeLessThanOrEqual(1);
  expect(audit.clippedControls, audit.clippedControls.join(", ")).toEqual([]);
  expect(audit.smallestFieldFont).toBeGreaterThanOrEqual(16);

  const responsive = await page.evaluate(() => {
    const columns = (selector: string) => getComputedStyle(document.querySelector(selector)!).gridTemplateColumns.split(" ").length;
    const navigation = document.querySelector<HTMLElement>(".mobile-app-navigation")!;
    const content = document.querySelector<HTMLElement>(".app-content")!;
    const table = document.querySelector<HTMLElement>(".responsive-table")!;
    const breadcrumb = document.querySelector<HTMLElement>(".app-breadcrumb")!;
    return {
      breadcrumbContained: breadcrumb.getBoundingClientRect().right <= document.documentElement.clientWidth + 1,
      breadcrumbTruncated: breadcrumb.scrollWidth > breadcrumb.clientWidth,
      contentBottomPadding: Number.parseFloat(getComputedStyle(content).paddingBottom),
      entityColumns: columns(".entity-grid"),
      metricsColumns: columns(".app-metrics"),
      navigationHeight: navigation.getBoundingClientRect().height,
      tableContainsItsOverflow: table.scrollWidth > table.clientWidth,
      taskColumns: columns(".task-board"),
    };
  });

  expect(responsive.metricsColumns).toBe(1);
  expect(responsive.entityColumns).toBe(1);
  expect(responsive.taskColumns).toBe(1);
  expect(responsive.tableContainsItsOverflow).toBe(true);
  expect(responsive.breadcrumbContained).toBe(true);
  expect(responsive.breadcrumbTruncated).toBe(true);
  expect(responsive.contentBottomPadding).toBeGreaterThan(responsive.navigationHeight + 20);
});

test("mudanças de orientação não deixam diálogos ou navegação fora da tela", async ({ page }) => {
  await page.goto("/");
  const initial = page.viewportSize();
  expect(initial).not.toBeNull();
  const rotated = initial!.width > initial!.height
    ? { width: Math.min(430, initial!.height), height: Math.max(700, initial!.width) }
    : { width: Math.max(667, initial!.height), height: Math.min(430, initial!.width) };

  await page.setViewportSize(rotated);
  await page.getByRole("button", { name: "Preferências de aparência e idioma" }).click();
  const preferences = page.getByRole("dialog", { name: "Preferências de aparência e idioma" });
  await expect(preferences).toBeVisible();
  const bounds = await preferences.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(rotated.width + 1);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(rotated.height + 1);
  expect((await auditViewport(page)).horizontalOverflow).toBeLessThanOrEqual(1);
});

async function auditViewport(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const visible = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
    };
    const controls = Array.from(document.querySelectorAll<HTMLElement>("input, select, textarea, button"))
      .filter(visible);
    const fields = controls.filter((element) => element.matches("input:not([type='checkbox']):not([type='radio']), select, textarea"));
    const clippedControls = controls
      .filter((element) => !element.closest(".responsive-table"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > root.clientWidth + 1;
      })
      .map((element) => element.getAttribute("aria-label") || element.id || element.textContent?.trim().slice(0, 40) || element.tagName);

    return {
      bodyTextLength: document.body.innerText.trim().length,
      clippedControls,
      horizontalOverflow: root.scrollWidth - root.clientWidth,
      smallestFieldFont: fields.length
        ? Math.min(...fields.map((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
        : 16,
      viewportMeta: document.querySelector<HTMLMetaElement>('meta[name="viewport"]')?.content ?? "",
    };
  });
}

const authenticatedMobileFixture = `
  <div class="app-layout">
    <aside class="app-sidebar"><nav><a class="active">Visão geral</a></nav></aside>
    <div class="app-workspace">
      <header class="app-topbar">
        <div><span class="app-breadcrumb">ProjetoComNomeExtremamenteLongoSemEspacosParaValidarOTopodoAplicativo</span><small>Dados protegidos</small></div>
        <div class="app-top-actions">
          <a class="notification-button app-appearance-button" href="#aparencia" aria-label="Aparência">A</a>
          <a class="notification-button" href="#notificacoes" aria-label="Notificações">N</a>
          <a class="user-avatar" href="#perfil" aria-label="Perfil">KS</a>
        </div>
      </header>
      <main class="app-content">
        <section class="app-welcome"><div><span class="eyebrow">OPERAÇÃO</span><h1>Uma visão clara mesmo durante uma consulta urgente pelo celular</h1><p>Dados importantes disponíveis sem depender de um computador.</p></div><button class="app-primary-button">Novo projeto</button></section>
        <section class="app-metrics">
          <article><span class="metric-card-icon">C</span><div><small>Clientes</small><strong>12</strong><span>ativos</span></div></article>
          <article><span class="metric-card-icon">P</span><div><small>Projetos</small><strong>8</strong><span>em andamento</span></div></article>
          <article><span class="metric-card-icon">A</span><div><small>Aprovações</small><strong>4</strong><span>pendentes</span></div></article>
          <article><span class="metric-card-icon">N</span><div><small>Alertas</small><strong>3</strong><span>não lidos</span></div></article>
        </section>
        <section class="dashboard-panel projects-panel">
          <div class="panel-heading"><div><span class="panel-kicker">PROJETOS</span><h2>Execução recente</h2></div></div>
          <div class="responsive-table"><table><thead><tr><th>Projeto</th><th>Cliente</th><th>Progresso</th><th>Prazo</th><th>Status</th></tr></thead><tbody><tr><td><strong>Identidade digital completa</strong><span>Entrega estratégica</span></td><td>Empresa Aurora</td><td>72%</td><td>30 ago</td><td><span class="status-badge">Ativo</span></td></tr></tbody></table></div>
        </section>
        <section class="dashboard-panel"><div class="section-mini-heading"><span class="panel-kicker">TAREFAS</span><h2>Quadro operacional</h2></div><div class="task-board"><section class="task-column"><div><article class="task-card">Planejamento</article></div></section><section class="task-column"><div><article class="task-card">Execução</article></div></section><section class="task-column"><div><article class="task-card">Concluído</article></div></section></div></section>
        <section class="dashboard-panel"><div class="section-mini-heading"><span class="panel-kicker">CLIENTES</span><h2>Carteira</h2></div><div class="entity-grid"><article class="entity-card"><span class="entity-avatar">AU</span><div class="entity-card-main"><span>Cliente</span><h3>Empresa Aurora</h3><p>Relacionamento ativo</p></div></article><article class="entity-card"><span class="entity-avatar">NE</span><div class="entity-card-main"><span>Cliente</span><h3>Nexo Estratégia</h3><p>Relacionamento ativo</p></div></article></div></section>
        <section class="settings-layout"><form class="settings-form"><section class="dashboard-panel settings-section"><div class="form-row"><div class="form-field"><label for="fixture-theme">Tema</label><select id="fixture-theme"><option>Claro</option></select></div><div class="form-field"><label for="fixture-company">Empresa</label><input id="fixture-company" value="Empresa Aurora"></div></div><div class="form-field"><label for="fixture-notes">Observações</label><textarea id="fixture-notes">Acompanhamento pelo celular</textarea></div><div class="settings-actions"><button class="app-primary-button">Salvar alterações</button></div></section></form><aside class="settings-aside"><article class="dashboard-panel"><h2>Preferências</h2><p>Configurações sincronizadas.</p></article></aside></section>
        <section class="ticket-conversation"><div class="section-mini-heading"><span class="panel-kicker">ATENDIMENTO</span><h2>Conversa</h2></div><div class="message-timeline"><article><span class="message-avatar">KS</span><div><header><strong>Kevin Santana</strong><time>Agora</time></header><p>Mensagem preservada e legível em telas pequenas.</p></div></article></div><div class="ticket-reply"><div class="form-field"><label for="fixture-reply">Responder</label><textarea id="fixture-reply"></textarea></div><button class="app-primary-button">Enviar resposta</button></div></section>
      </main>
    </div>
    <nav class="mobile-app-navigation" aria-label="Navegação móvel do espaço"><a class="active" href="#inicio"><span>Início</span></a><a href="#tarefas"><span>Tarefas</span></a><a href="#projetos"><span>Projetos</span></a><a href="#clientes"><span>Clientes</span></a><button type="button"><span>Mais</span></button></nav>
  </div>`;
