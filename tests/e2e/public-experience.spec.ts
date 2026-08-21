import { expect, test } from "@playwright/test";

test("a chamada gratuita abre o cadastro real", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Transforme cada cliente/ })).toBeVisible();
  await page.getByRole("link", { name: "Criar conta gratuita" }).first().click();
  await expect(page).toHaveURL(/\/cadastro$/);
  await expect(page.getByRole("heading", { level: 1, name: /Crie o espaço/ })).toBeVisible();
});

test("tema e idioma persistem como preferências acessíveis", async ({ page }) => {
  await page.goto("/");
  const preferences = page.locator('summary[aria-label="Preferências de aparência e idioma"]');
  await expect(preferences).toBeVisible();
  await preferences.click();
  await page.getByRole("button", { name: "Preto e branco" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "mono");
  await page.getByRole("combobox", { name: "Idioma" }).selectOption("es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { level: 1, name: /Convierte cada cliente/ })).toBeVisible();
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
});

test("a navegação móvel não cria rolagem horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.getByRole("navigation", { name: "Navegação móvel" })).toBeVisible();
  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1);
});

for (const width of [390, 320]) {
  test(`as preferências permanecem inteiras em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.locator('summary[aria-label="Preferências de aparência e idioma"]').click();

    const panel = page.locator(".preferences-panel");
    await expect(panel).toBeVisible();
    const bounds = await panel.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);

    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1);
  });
}

test("a página de status comunica a disponibilidade sem detalhes internos", async ({ page }) => {
  await page.goto("/status");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/sistemas|serviços/);
  await expect(page.getByText("Aplicação web")).toBeVisible();
  await expect(page.getByText("Dados e autenticação")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/SUPABASE|service_role|postgres/);
});
