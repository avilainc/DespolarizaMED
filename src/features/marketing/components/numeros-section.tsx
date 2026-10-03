import { unstable_cache } from "next/cache";
import { listarProvas } from "@/features/library/queries";
import { totalDeQuestoes } from "./hero";

/**
 * Faixa "em números", logo abaixo do hero — a página 2 do documento de
 * redesign do Paulo: números concretos convertem mais que nome de instituição,
 * e os nomes ficam embaixo, menores, como confirmação.
 *
 * Diferença deliberada para o rascunho dele: lá havia "120+ alunos" e "94% de
 * satisfação", que eram ilustrativos. Aqui só entra número que o banco
 * sustenta, contado a cada 5 minutos — e um número zerado some, em vez de
 * anunciar "0 provas". Se nada tiver número, a faixa inteira não aparece.
 *
 * Cada número numa cor da marca (laranja, teal, azul-claro), como no
 * rascunho: é a faixa que mais "acende" a página.
 */
const provasDaVitrine = unstable_cache(
  async () => {
    const provas = await listarProvas();
    const instituicoes = [...new Set(provas.map((p) => p.instituicao).filter(Boolean))] as string[];
    return { provas: provas.length, instituicoes };
  },
  ["provas-vitrine"],
  { revalidate: 300 },
);

const CORES = ["var(--brand-orange-texto)", "var(--brand-teal-texto)", "var(--brand-600)"];

export async function NumerosSection() {
  const [questoes, { provas, instituicoes }] = await Promise.all([
    totalDeQuestoes(),
    provasDaVitrine(),
  ]);

  const numeros = [
    { valor: questoes, rotulo: "questões reais de vestibular no banco" },
    { valor: provas, rotulo: "provas completas para resolver do começo ao fim" },
    { valor: instituicoes.length, rotulo: "instituições com prova no acervo" },
  ].filter((n) => n.valor > 0);

  if (numeros.length === 0) return null;

  return (
    <section aria-label="Em números" className="border-b border-border bg-surface-subtle/50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <p className="t-eyebrow text-center text-text-muted">Em números</p>
        <dl
          className="mt-7 grid gap-8 text-center sm:gap-6"
          style={{ gridTemplateColumns: `repeat(auto-fit, minmax(12rem, 1fr))` }}
        >
          {numeros.map((n, i) => (
            <div key={n.rotulo} className="flex flex-col-reverse items-center gap-1.5">
              <dt className="max-w-[24ch] text-[0.9375rem] text-text-secondary">{n.rotulo}</dt>
              <dd
                className="font-display text-[2.5rem] font-bold leading-none tracking-tight tabular sm:text-[3rem]"
                style={{ color: CORES[i % CORES.length] }}
              >
                {n.valor.toLocaleString("pt-BR")}
              </dd>
            </div>
          ))}
        </dl>

        {instituicoes.length > 0 && (
          <div className="mt-10 border-t border-border pt-7 text-center">
            <p className="t-eyebrow text-text-muted">Provas das principais instituições</p>
            <ul className="mx-auto mt-3 flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-2 font-display text-[0.9375rem] font-semibold text-text-secondary">
              {instituicoes.slice(0, 12).map((nome) => (
                <li key={nome}>{nome}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
