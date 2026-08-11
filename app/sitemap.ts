import type { MetadataRoute } from "next";

const baseUrl = "https://prismivo.kevinsantanadev.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const legalPages = ["privacidade", "termos", "cookies", "cancelamento", "acessibilidade", "seguranca"];
  const contentPages = ["operacoes-conectadas", "aprovacoes-sem-atrito", "seguranca-multitenant", "onboarding-que-gera-valor", "metricas-operacionais-uteis", "acessibilidade-em-produtos-b2b", "atendimento-com-historico", "governanca-de-arquivos"];

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/conteudo`, changeFrequency: "weekly", priority: 0.8 },
    ...contentPages.map((slug) => ({
      url: `${baseUrl}/conteudo/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    ...legalPages.map((slug) => ({
      url: `${baseUrl}/legal/${slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
