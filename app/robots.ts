import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/legal/"],
      disallow: ["/app/", "/api/", "/entrar", "/cadastro"],
    },
    sitemap: "https://prismivo.kevinsantanadev.com.br/sitemap.xml",
    host: "https://prismivo.kevinsantanadev.com.br",
  };
}
