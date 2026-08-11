import type { MetadataRoute } from "next";

const baseUrl = "https://prismivo.kevinsantanadev.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const legalPages = ["privacidade", "termos", "cookies", "cancelamento", "acessibilidade", "seguranca"];

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    ...legalPages.map((slug) => ({
      url: `${baseUrl}/legal/${slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
