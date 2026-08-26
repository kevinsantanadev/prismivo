import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SitePreferencesProvider } from "./components/site-preferences";
import { ServiceWorkerRegistration } from "./components/service-worker-registration";
import "./globals.css";
import "./premium-design.css";

const preferenceBootScript = `(()=>{try{const r=document.documentElement,s=localStorage,p=(k,v,d)=>{const x=s.getItem(k);return v.includes(x)?x:d};const t=p("prismivo-theme",["system","light","dark","mono"],"system"),resolved=t==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;r.dataset.theme=resolved;r.style.colorScheme=resolved==="light"?"light":"dark";const l=s.getItem("prismivo-locale");if(["pt-BR","en","es"].includes(l))r.lang=l;r.dataset.accent=p("prismivo-accent",["lime","violet","blue","amber","teal","rose"],"lime");r.dataset.interfaceFilter=p("prismivo-interface-filter",["none","soft","crisp","grayscale"],"none");r.dataset.colorVision=p("prismivo-color-vision",["standard","protanopia","deuteranopia","tritanopia","achromatopsia"],"standard");r.dataset.sidebarMode=p("prismivo-sidebar-mode",["adaptive","light","dark","brand"],"adaptive");r.dataset.interfaceDensity=p("prismivo-interface-density",["compact","comfortable","spacious"],"comfortable");r.dataset.contentWidth=p("prismivo-content-width",["focused","standard","wide"],"standard");r.dataset.cornerStyle=p("prismivo-corner-style",["soft","rounded","square"],"rounded");r.dataset.textScale=p("prismivo-text-scale",["default","large","extra-large"],"default");const m=p("prismivo-motion-mode",["system","full","reduced"],"system");r.dataset.motion=m==="system"?(matchMedia("(prefers-reduced-motion: reduce)").matches?"reduced":"full"):m;}catch{}})();`;

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
