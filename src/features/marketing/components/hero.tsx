import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ArrowRight, Check, CircleHelp, Dna, Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { contarQuestoes } from "@/features/library/queries";

/**
 * O tamanho do acervo, contado no banco e guardado por 5 minutos — a mesma
 * decisão que `plans-section.tsx` tomou para o preço, e pelo mesmo motivo.
 *
 * O texto aqui dizia "mais de 26 mil questões", copiado do metadata do site.
 * Número escrito à mão numa vitrine envelhece calado: cresce o acervo e a home
 * continua anunciando o valor de um ano atrás, ou pior, anuncia um volume que
 * o banco não tem. Contar custa uma consulta a cada 5 minutos.
 */
const totalDeQuestoes = unstable_cache(() => contarQuestoes({}), ["questoes-validadas-vitrine"], {
  revalidate: 300,
});

const destaques = [
  "Aulas de Biologia, Física e Química",
  "Banco de questões com filtros por vestibular",
  "Plantões semanais ao vivo",
];

/**
 * Amostra estática do card de questão, com a mesma anatomia do componente real
 * (`features/library/components/question-card.tsx`): cabeçalho com banca, ano
 * e matéria; enunciado com medida de leitura; alternativas com a letra num
 * quadrado; e o bloco de resultado.
 *
 * É marcação própria, e não o componente de verdade, por um motivo: aquele é
 * um client component que responde, grava em `practice_answers` e busca o
 * gabarito no servidor. Aqui não há sessão nem questão — é uma vitrine. O que
 * não pode divergir é a APARÊNCIA, então as classes são as mesmas.
 */
function AmostraDeQuestao() {
  const alternativas = [
    { letra: "A", texto: "apenas a membrana externa é de origem bacteriana." },
    { letra: "B", texto: "descendem de bactérias que passaram a viver dentro de outra célula." },
    { letra: "C", texto: "surgiram por invaginação da membrana plasmática." },
  ];

  return (
    <div
      aria-hidden
      className="cartao overflow-hidden shadow-lg"
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-subtle/60 px-4 py-3">
        <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-brand-700">
          FUVEST
        </span>
        <span className="inline-flex items-center rounded-md bg-surface-subtle px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-text-secondary">
          2025
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide"
          style={{
            background: "color-mix(in oklch, var(--materia-bio) 12%, transparent)",
            color: "var(--materia-bio)",
          }}
        >
          <Dna className="size-3" />
          Biologia
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-text-muted">
          <Star className="size-[1.125rem] fill-warning text-warning" />
        </span>
      </header>

      <div className="px-4 py-5">
        <p className="t-leitura text-text-primary">
          As mitocôndrias e os cloroplastos têm DNA próprio, ribossomos e dupla membrana. Essas
          características sustentam a teoria endossimbiôntica, segundo a qual essas organelas
        </p>

        <ol className="mt-5 space-y-2">
          {alternativas.map((alt) => {
            const certa = alt.letra === "B";
            return (
              <li
                key={alt.letra}
                className={[
                  "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-[0.9375rem] leading-relaxed",
                  certa ? "border-success/45 bg-success-soft" : "border-border",
                ].join(" ")}
              >
                <span
                  className={[
                    "mt-px inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[0.8125rem] font-semibold",
                    certa ? "bg-success text-white" : "bg-surface-subtle text-text-secondary",
                  ].join(" ")}
                >
                  {alt.letra}
                </span>
                <span className="flex-1">{alt.texto}</span>
                {certa && <Check className="mt-0.5 size-4 shrink-0 text-success-text" />}
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-success-soft px-4 py-3 text-[0.875rem] text-success-text">
          <Check className="size-4 shrink-0" />
          <strong className="font-semibold">Você acertou.</strong>
          <span>Resposta correta: B</span>
        </div>
      </div>
    </div>
  );
}

export async function Hero() {
  const questoes = await totalDeQuestoes();

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-50 to-background">
      {/* Trama do axônio do emblema. Fica atrás de tudo, quase invisível, e
          some antes de chegar no card — textura da marca, não gradiente. */}
      <div
        aria-hidden
        className="trama-axonio pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
      />

      <div className="secao-vitrine relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14">
        <div className="min-w-0">
          {/* `text-brand-orange-texto`, não `text-brand-orange`: o laranja cheio
              sobre este fundo mede 2.20:1, e AA exige 4.5:1 para 14px. */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/15 px-3 py-1 text-[0.8125rem] font-medium text-brand-orange-texto">
            <CircleHelp className="size-3.5" aria-hidden />
            Preparação para vestibulares de Medicina
          </span>

          <h1 className="t-display mt-5 text-text-primary">
            Aulas, questões e provas antigas — num lugar só.
          </h1>

          <p className="mt-4 max-w-[52ch] text-[1.0625rem] leading-relaxed text-text-secondary">
            {questoes > 0 ? (
              <>
                <strong className="font-semibold text-text-primary">
                  {questoes.toLocaleString("pt-BR")} questões
                </strong>{" "}
                extraídas de provas originais, com gabarito conferido contra o caderno oficial.
              </>
            ) : (
              <>Questões extraídas de provas originais, com gabarito conferido contra o caderno oficial.</>
            )}{" "}
            Plano de estudos até a data da sua prova e plantões ao vivo com os professores.
          </p>

          <ul className="mt-6 space-y-2.5">
            {destaques.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[0.9375rem]">
                <Check
                  aria-hidden
                  className="size-4 shrink-0 text-success"
                  strokeWidth={2.5}
                />
                <span className="text-text-secondary">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/cadastro" className={buttonVariants({ size: "lg" })}>
              Começar agora
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Link>
            <Link href="/#planos" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Ver planos
            </Link>
          </div>
        </div>

        {/* O produto, e não um desenho do produto.
            Aqui havia o emblema da marca ampliado dentro de um card vazio —
            o logotipo repetido a 30cm do logotipo do cabeçalho, e nenhuma
            evidência do que se está comprando. Um banco de questões se mostra
            mostrando uma questão. */}
        {/* Também no celular. A amostra ficava em `hidden lg:block`, e como o
            tráfego de vestibulando vem sobretudo do Instagram, quem mais chega
            aqui era justamente quem NÃO via o produto — sobrava a promessa. */}
        <div className="min-w-0">
          <AmostraDeQuestao />
        </div>
      </div>
    </section>
  );
}
