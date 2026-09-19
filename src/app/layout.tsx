import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono, Inter } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * Duas famílias, com papéis separados.
 *
 * `Inter` é a fonte de interface: rótulo, botão, tabela, enunciado. Foi a
 * escolhida em vez de continuar com a Geist por um motivo concreto — o
 * `--font-sans` do tema apontava para uma variável que NUNCA era definida
 * (`@theme inline { --font-sans: var(--font-sans) }` é circular), e o
 * `@apply font-sans` no <html> caía no serifado padrão do navegador. A
 * plataforma inteira estava sendo renderizada em Times New Roman; era daí que
 * vinha a impressão de tipografia "antiquada".
 *
 * `Bricolage Grotesque` é a fonte de display: título de página, título de
 * seção e número de métrica. É uma grotesca editorial, com personalidade
 * própria sem virar fonte de cartaz — o contraponto sério ao logotipo, que é
 * arredondado e informal. Só entra em tamanho grande, nunca em texto corrido.
 *
 * Ambas variáveis e com `display: "swap"`: o texto aparece na primeira pintura
 * com a fonte do sistema e troca quando a fonte chega, em vez de segurar o LCP.
 */
const interfaceFont = Inter({
  variable: "--font-interface",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
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

/**
 * `themeColor` pinta a barra do navegador no Android e a status bar do PWA com
 * o azul institucional; sem ele o app instalado abre com uma faixa branca por
 * cima da marca. `maximumScale` fica livre de propósito — travar o zoom é uma
 * falha de acessibilidade.
 */
export const viewport: Viewport = {
  themeColor: "#184878",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${interfaceFont.variable} ${displayFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
