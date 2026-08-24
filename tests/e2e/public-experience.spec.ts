import { expect, test } from "@playwright/test";

test("a chamada gratuita abre o cadastro real", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Transforme cada cliente/ })).toBeVisible();
  await page.getByRole("link", { name: "Criar conta gratuita" }).first().click();
  await expect(page).toHaveURL(/\/cadastro$/);
  await expect(page.getByRole("heading", { level: 1, name: /Crie o espaço/ })).toBeVisible();
});

test("o login mantém uma única ação de senha e hierarquia limpa", async ({ page }) => {
  await page.goto("/entrar");

  await expect(page.locator(".access-flow")).toHaveCount(0);
  await expect(page.locator(".access-card-status-label")).toContainText("Fluxo de identidade");
  await expect(page.locator(".access-status-badge")).toHaveText("PROTEGIDO");

  const statusLabel = await page.locator(".access-card-status-label").boundingBox();
  const statusBadge = await page.locator(".access-status-badge").boundingBox();
  expect(statusLabel).not.toBeNull();
  expect(statusBadge).not.toBeNull();
  expect(statusLabel!.x + statusLabel!.width).toBeLessThan(statusBadge!.x);

  const password = page.locator("#auth-password");
  const toggle = page.getByRole("button", { name: "Mostrar senha" });
  await expect(password).toBeVisible();
  await expect(toggle).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Esqueci minha senha" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reenviar confirmação" })).toHaveCount(0);

  const field = await page.locator(".password-input-wrap").boundingBox();
  const action = await toggle.boundingBox();
  expect(field).not.toBeNull();
  expect(action).not.toBeNull();
  expect(action!.x).toBeGreaterThanOrEqual(field!.x);
  expect(action!.x + action!.width).toBeLessThanOrEqual(field!.x + field!.width);
  expect(action!.y).toBeGreaterThanOrEqual(field!.y);
  expect(action!.y + action!.height).toBeLessThanOrEqual(field!.y + field!.height);
});

test("o cadastro usa um indicador de senha compacto", async ({ page }) => {
  await page.goto("/cadastro");

  await expect(page.locator(".password-checklist")).toHaveCount(0);
  const strength = page.locator(".password-strength");
  await expect(strength).toBeVisible();
  await expect(strength.locator(".password-strength-meter span")).toHaveCount(5);
  await page.getByLabel("Senha", { exact: true }).fill("Prisma1!");
  await expect(strength).toContainText("Forte");
  await expect(strength).toContainText("8 caracteres");

  const strengthBounds = await strength.boundingBox();
  expect(strengthBounds).not.toBeNull();
  expect(strengthBounds!.height).toBeLessThanOrEqual(96);
  await expect(page.getByRole("button", { name: "Mostrar senha" })).toHaveCount(2);
});

test("tema e idioma persistem como preferências acessíveis", async ({ page }) => {
  await page.goto("/");
  const preferences = page.getByRole("button", { name: "Preferências de aparência e idioma" });
  await expect(preferences).toBeVisible();
  await preferences.click();
  await expect(page.getByRole("dialog", { name: "Preferências de aparência e idioma" })).toBeVisible();
  await page.getByRole("button", { name: "Preto e branco" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "mono");
  await page.getByRole("combobox", { name: "Idioma" }).selectOption("es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { level: 1, name: /Convierte cada cliente/ })).toBeVisible();
  await page.getByRole("button", { name: "Cerrar preferencias" }).click();
  await expect(page.getByRole("dialog", { name: "Preferencias de apariencia e idioma" })).not.toBeVisible();
  await page.getByRole("link", { name: "Crear cuenta gratuita" }).first().click();
  await expect(page).toHaveURL(/\/cadastro$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { level: 1, name: /Crea el espacio/ })).toBeVisible();
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
});

test("rotas privadas redirecionam e a saúde pública não expõe segredos", async ({ page, request }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/entrar/);
  const health = await request.get("/api/health");
  expect([200, 503]).toContain(health.status());
  expect(health.headers()["cache-control"]).toContain("no-store");
  const body = await health.json();
  expect(body.service).toBe("prismivo-web");
  expect(["ok", "degraded"]).toContain(body.status);
  expect(body).not.toHaveProperty("environment");

  const serviceWorker = await request.get("/sw.js");
  expect(serviceWorker.ok()).toBe(true);
  expect(serviceWorker.headers()["cache-control"]).toContain("no-store");
});

test("todas as áreas privadas exigem uma sessão válida", async ({ page }) => {
  const privateRoutes = [
    "/app",
    "/app/tarefas",
    "/app/projetos",
    "/app/clientes",
    "/app/aprovacoes",
    "/app/arquivos",
    "/app/atendimento",
    "/app/conteudo",
    "/app/assinatura",
    "/app/notificacoes",
    "/app/equipe",
    "/app/administracao",
    "/app/configuracoes",
  ];

  for (const route of privateRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/entrar/);
  }
});

test("a navegação móvel não cria rolagem horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.getByRole("navigation", { name: "Navegação móvel" })).toBeVisible();
  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1);
});

test("a atmosfera prismática responde ao ponteiro e respeita redução de movimento", async ({ page }) => {
  await page.goto("/");
  const supportsPrecisePointer = await page.evaluate(() => window.matchMedia("(pointer: fine)").matches);
  await page.mouse.move(260, 180);
  if (supportsPrecisePointer) {
    await expect(page.locator("html")).toHaveAttribute("data-pointer-atmosphere", "active");
  } else {
    await expect(page.locator("html")).not.toHaveAttribute("data-pointer-atmosphere", "active");
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.mouse.move(480, 260);
  await expect(page.locator("html")).not.toHaveAttribute("data-pointer-atmosphere", "active");
});

for (const width of [390, 320]) {
  test(`as preferências permanecem inteiras em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const preferences = page.getByRole("button", { name: "Preferências de aparência e idioma" });
    await preferences.click();

    const dialog = page.getByRole("dialog", { name: "Preferências de aparência e idioma" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("heading", { name: "Preferências de aparência e idioma" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Fechar preferências" })).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(11);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width - 11);
    expect(bounds!.width).toBeGreaterThanOrEqual(width - 26);
    expect(Math.abs((bounds!.x + bounds!.width / 2) - width / 2)).toBeLessThanOrEqual(1);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844 - 11);

    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1);

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(preferences).toBeFocused();

    await preferences.click();
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Automático" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Claro" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Escuro" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Preto e branco" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Idioma" })).toBeVisible();
    await page.getByRole("button", { name: "Escuro" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Fechar preferências" }).click();
    await expect(dialog).not.toBeVisible();
  });
}

test("a página de status comunica a disponibilidade sem detalhes internos", async ({ page }) => {
  await page.goto("/status");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/sistemas|serviços/);
  await expect(page.getByText("Aplicação web")).toBeVisible();
  await expect(page.getByText("Dados e autenticação")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/SUPABASE|service_role|postgres/);
});
