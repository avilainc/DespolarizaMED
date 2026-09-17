import type { MetadataRoute } from "next";
import { ROTAS_PRIVADAS, SITE_URL } from "@/lib/site";

/**
 * `/robots.txt` — respondia 404, o que não bloqueia nada mas também não diz
 * onde está o sitemap, e deixa o buscador gastando rastreio em `/dashboard`,
 * `/gestao` e afins, que só devolvem redirect para o login.
 *
 * Gerado pelo Next em vez de arquivo estático em `public/`: a lista de rotas
 * privadas fica junto do sitemap em `lib/site.ts`, e as duas não divergem.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ROTAS_PRIVADAS.map((rota) => `${rota}/`),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
