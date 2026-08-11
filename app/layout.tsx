import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SitePreferencesProvider } from "./components/site-preferences";
import { ServiceWorkerRegistration } from "./components/service-worker-registration";
import "./globals.css";

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SitePreferencesProvider>{children}<ServiceWorkerRegistration /></SitePreferencesProvider>
      </body>
    </html>
  );
}
