import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "DespolarizaMED",
  description: "Plataforma de preparação para vestibulares de Medicina",
  // Ícones e manifesto declarados pelo metadata do Next em vez de <link> solto
  // no JSX: o Next injeta as tags no <head> de toda página, deduplica e mantém
  // a ordem. Os arquivos vêm do RealFaviconGenerator e ficam em public/.
  icons: {
    icon: [
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
  appleWebApp: { title: "DespolarizaMED" },
  // metadataBase resolve as URLs relativas de openGraph/twitter para absolutas.
  // Sem ele o Next avisa no build e o WhatsApp recebe um caminho relativo, que
  // não resolve para imagem nenhuma.
  metadataBase: new URL("https://despolarizamed.com.br"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "DespolarizaMED",
    title: "DespolarizaMED",
    description: "Plataforma de preparação para vestibulares de Medicina",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "DespolarizaMED" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DespolarizaMED",
    description: "Plataforma de preparação para vestibulares de Medicina",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
