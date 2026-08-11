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
  await page.getByRole("button", { name: "Preferências de aparência e idioma" }).click();
  await page.getByRole("button", { name: "Preto e branco" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "mono");
  await page.getByRole("combobox", { name: "Idioma" }).selectOption("es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { level: 1, name: /Convierte cada cliente/ })).toBeVisible();
});

test("rotas privadas redirecionam e a saúde pública não expõe segredos", async ({ page, request }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/entrar/);
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(health.headers()["cache-control"]).toContain("no-store");
  const body = await health.json();
  expect(body.service).toBe("prismivo-web");
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

test("a página de status comunica a disponibilidade sem detalhes internos", async ({ page }) => {
  await page.goto("/status");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/sistemas|serviços/);
  await expect(page.getByText("Aplicação web")).toBeVisible();
  await expect(page.getByText("Dados e autenticação")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/SUPABASE|service_role|postgres/);
});
