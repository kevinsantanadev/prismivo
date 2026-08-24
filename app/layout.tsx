import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SitePreferencesProvider } from "./components/site-preferences";
import { ServiceWorkerRegistration } from "./components/service-worker-registration";
import "./globals.css";

const preferenceBootScript = `(()=>{try{const r=document.documentElement,s=localStorage;const t=s.getItem("prismivo-theme");const v=["system","light","dark","mono"].includes(t)?t:"system";const resolved=v==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):v;r.dataset.theme=resolved;r.style.colorScheme=resolved==="light"?"light":"dark";const l=s.getItem("prismivo-locale");if(["pt-BR","en","es"].includes(l))r.lang=l;const a=s.getItem("prismivo-accent");if(["lime","violet","blue","amber","teal","rose"].includes(a))r.dataset.accent=a;const f=s.getItem("prismivo-interface-filter");if(["none","soft","crisp","grayscale"].includes(f))r.dataset.interfaceFilter=f;const c=s.getItem("prismivo-color-vision");if(["standard","protanopia","deuteranopia","tritanopia","achromatopsia"].includes(c))r.dataset.colorVision=c;}catch{}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prismivo.kevinsantanadev.com.br"),
  title: {
    default: "Prismivo | Client operations, finalmente claras",
    template: "%s | Prismivo",
  },
  description:
    "Centralize clientes, projetos, aprovações, arquivos, atendimento e cobranças em uma operação clara e rastreável.",
  applicationName: "Prismivo",
  keywords: [
    "gestão de clientes",
    "portal do cliente",
    "operações de serviços",
    "aprovação de projetos",
    "SaaS B2B",
  ],
  authors: [{ name: "Prismivo" }],
  creator: "Prismivo",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    alternateLocale: ["en_US", "es_ES"],
    title: "Prismivo | Client operations, finalmente claras",
    description:
      "Uma central operacional para empresas de serviços conduzirem cada cliente com clareza.",
    siteName: "Prismivo",
    url: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceBootScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SitePreferencesProvider>{children}<ServiceWorkerRegistration /></SitePreferencesProvider>
      </body>
    </html>
  );
}
