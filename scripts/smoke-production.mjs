const baseUrl = (process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

if (!baseUrl) {
  console.error("Informe a URL: npm run smoke:production -- https://dominio.example");
  process.exit(1);
}

const checks = [
  { path: "/", contains: "PRISMIVO" },
  { path: "/entrar", contains: "type=\"email\"" },
  { path: "/cadastro", contains: "type=\"email\"" },
  { path: "/status", contains: "Aplicação web" },
  { path: "/robots.txt", contains: "User-Agent" },
  { path: "/sitemap.xml", contains: "<urlset" },
];

const forbiddenMarkers = ["signin-with-", "legacy identity"];
const failures = [];

async function request(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "user-agent": "Prismivo production smoke check" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  return { response, body: await response.text() };
}

for (const check of checks) {
  try {
    const { response, body } = await request(check.path);
    if (!response.ok) failures.push(`${check.path}: HTTP ${response.status}`);
    if (!body.includes(check.contains)) failures.push(`${check.path}: conteúdo esperado ausente`);
    const normalized = body.toLowerCase();
    for (const marker of forbiddenMarkers) {
      if (normalized.includes(marker)) failures.push(`${check.path}: marcador legado detectado`);
    }
  } catch (error) {
    failures.push(`${check.path}: ${error instanceof Error ? error.message : "falha de rede"}`);
  }
}

try {
  const { response, body } = await request("/api/health");
  const health = JSON.parse(body);
  if (!response.ok || health.status !== "ok" || health.checks?.database !== "ready") {
    failures.push("/api/health: aplicação ou banco não estão prontos");
  }
  if ("environment" in health || "secrets" in health) failures.push("/api/health: resposta expõe detalhes internos");
} catch (error) {
  failures.push(`/api/health: ${error instanceof Error ? error.message : "resposta inválida"}`);
}

if (failures.length > 0) {
  console.error("Smoke test de produção reprovado:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Smoke test de produção aprovado em ${baseUrl}.`);
