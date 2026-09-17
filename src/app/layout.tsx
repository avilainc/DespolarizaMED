import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRICAO =
  "Aulas, banco com mais de 26 mil questões de vestibular, provas antigas resolvidas e plantões ao vivo para quem vai prestar Medicina.";

export const metadata: Metadata = {
  // O título era só "DespolarizaMED", sem nenhuma palavra que alguém procure.
  // Quem busca não digita o nome de uma plataforma que ainda não conhece.
  title: "DespolarizaMED — preparação para vestibulares de Medicina",
  description: DESCRICAO,
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
  metadataBase: new URL(SITE_URL),
  // Canonical da raiz. Cada página pública que precisar de um próprio declara
  // o seu; sem isto, variações de URL (utm, barra final) viram páginas
  // distintas para o buscador.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "DespolarizaMED",
    title: "DespolarizaMED — preparação para vestibulares de Medicina",
    description: DESCRICAO,
    // Sem `images` aqui de propósito: quem gera é `app/opengraph-image.tsx`.
    // Declarar a imagem no metadata sobrepõe a convenção de arquivo, e era o
    // que mantinha o og.png borrado no ar.
  },
  twitter: {
    card: "summary_large_image",
    title: "DespolarizaMED — preparação para vestibulares de Medicina",
    description: DESCRICAO,
    // Idem: `app/twitter-image.tsx`.
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
