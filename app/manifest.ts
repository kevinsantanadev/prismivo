import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prismivo — Client Operations",
    short_name: "Prismivo",
    description: "Clientes, projetos, aprovações, arquivos e atendimento em uma operação clara.",
    start_url: "/",
    display: "standalone",
    background_color: "#111411",
    theme_color: "#111411",
    lang: "pt-BR",
    categories: ["business", "productivity"],
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
