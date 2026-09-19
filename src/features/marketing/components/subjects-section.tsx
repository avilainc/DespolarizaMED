import { subjects } from "@/features/marketing/content";
import { visualDaMateria } from "@/lib/materias";
import { CabecalhoDeSecao } from "./secao";

/**
 * As disciplinas na landing, com a mesma identidade que elas têm dentro da
 * plataforma: ícone, cor e ilustração científica vindos de `visualDaMateria`.
 *
 * Antes cada seção escolhia o próprio ícone e ninguém escolhia cor — quem via
 * "Biologia" na home e "Biologia" no painel via duas coisas diferentes.
 */
export function SubjectsSection() {
  return (
    <section id="disciplinas" className="secao-vitrine mx-auto max-w-6xl px-4 sm:px-6">
      <CabecalhoDeSecao
        sobretitulo="O que você estuda"
        titulo="Disciplinas"
        descricao="Conteúdo organizado em Disciplina → Módulo → Aula, cobrindo exatamente o que cai nos principais vestibulares de Medicina."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {subjects.map((subject) => {
          const visual = visualDaMateria(subject.slug);
          return (
            <article
              key={subject.slug}
              className="cartao cartao-p-lg relative flex flex-col overflow-hidden"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: visual.cor }}
              />
              <span
                aria-hidden
                className="inline-flex size-12 items-center justify-center rounded-2xl"
                style={{
                  background: `color-mix(in oklch, ${visual.cor} 12%, transparent)`,
                  color: visual.cor,
                }}
              >
                <visual.icone className="size-6" />
              </span>
              <h3 className="t-section mt-4 text-text-primary">{subject.name}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-text-secondary">
                {subject.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
