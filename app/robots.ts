import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/conteudo/", "/legal/"],
      disallow: [
        "/app/",
        "/api/",
        "/auth/",
        "/convite/",
        "/entrar",
        "/cadastro",
        "/recuperar-senha",
        "/redefinir-senha",
        "/manutencao",
        "/offline",
        "/status",
      ],
    },
    sitemap: "https://prismivo.kevinsantanadev.com.br/sitemap.xml",
    host: "https://prismivo.kevinsantanadev.com.br",
  };
}
