import type { MetadataRoute } from "next";
import { ROTAS_PUBLICAS, SITE_URL } from "@/lib/site";

/**
 * `/sitemap.xml` — respondia 404.
 *
 * Só as rotas que um anônimo alcança. Aula, questão e prova ficam de fora de
 * propósito: são conteúdo pago, e listá-las aqui entregaria o catálogo inteiro
 * a quem não assina, além de encher o índice de URLs que só devolvem redirect
 * para o login.
 *
 * Sem `lastModified` por página: mentir a data (usar `new Date()` a cada
 * geração) faz o buscador reavaliar tudo a toda hora e perde credibilidade.
 * Quando houver blog de verdade, cada post entra aqui com a data real dele.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const prioridade: Record<string, number> = { "/": 1, "/blog": 0.5 };

  return ROTAS_PUBLICAS.map((rota) => ({
    url: `${SITE_URL}${rota}`,
    changeFrequency: rota === "/" ? ("weekly" as const) : ("monthly" as const),
    priority: prioridade[rota] ?? 0.3,
  }));
}
