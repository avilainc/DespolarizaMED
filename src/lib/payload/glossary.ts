import { getPayloadClient } from "@/lib/payload";
import type { Where } from "payload";
import type { GlossaryTerm } from "@/payload/payload-types";

export async function getGlossaryTerms(filtro: { busca?: string; subjectId?: number } = {}) {
  const payload = await getPayloadClient();
  const where: Where = {};
  if (filtro.subjectId) where.subject = { equals: filtro.subjectId };
  if (filtro.busca?.trim()) {
    where.or = [
      { term: { like: filtro.busca.trim() } },
      { definition: { like: filtro.busca.trim() } },
    ];
  }
  const result = await payload.find({
    collection: "glossary-terms",
    where,
    sort: "term",
    limit: 500,
    depth: 1,
  });
  return result.docs as GlossaryTerm[];
}

export async function getGlossaryTermsByIds(ids: number[]) {
  if (!ids.length) return [];
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "glossary-terms",
    where: { id: { in: ids } },
    limit: ids.length,
    depth: 1,
  });
  return result.docs as GlossaryTerm[];
}
