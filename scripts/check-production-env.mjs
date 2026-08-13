const requiredVariables = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_STORAGE_BUCKET",
  "RATE_LIMIT_PEPPER",
];

const errors = [];
const value = (name) => process.env[name]?.trim() ?? "";

for (const name of requiredVariables) {
  if (!value(name)) errors.push(`${name} não foi definida.`);
}

function requireSecureUrl(name, expectedHostname) {
  const candidate = value(name);
  if (!candidate) return;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") errors.push(`${name} precisa usar HTTPS.`);
    if (expectedHostname && url.hostname !== expectedHostname) {
      errors.push(`${name} precisa apontar para ${expectedHostname}.`);
    }
  } catch {
    errors.push(`${name} não contém uma URL válida.`);
  }
}

requireSecureUrl("NEXT_PUBLIC_APP_URL", "prismivo.kevinsantanadev.com.br");
requireSecureUrl("NEXT_PUBLIC_SUPABASE_URL");

if (value("NEXT_PUBLIC_SUPABASE_URL") && !value("NEXT_PUBLIC_SUPABASE_URL").endsWith(".supabase.co")) {
  errors.push("NEXT_PUBLIC_SUPABASE_URL precisa usar o projeto Supabase dedicado ao Prismivo.");
}

const publishableKey = value("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
if (publishableKey && !(publishableKey.startsWith("sb_publishable_") || publishableKey.startsWith("eyJ"))) {
  errors.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não possui um formato reconhecido.");
}

const pepper = value("RATE_LIMIT_PEPPER");
if (pepper && (pepper.length < 32 || /gere-|exemplo|example|changeme/i.test(pepper))) {
  errors.push("RATE_LIMIT_PEPPER precisa ser um segredo aleatório com pelo menos 32 caracteres.");
}

if (errors.length > 0) {
  console.error("Configuração de produção reprovada:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Configuração obrigatória de produção aprovada.");
