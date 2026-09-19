import Image from "next/image";
import { subjects } from "@/features/marketing/content";
import { visualDaMateria } from "@/lib/materias";

/**
 * As disciplinas na landing, com a mesma identidade que elas têm dentro da
 * plataforma: ícone, cor e ilustração científica vindos de `visualDaMateria`.
 *
 * Antes cada seção escolhia o próprio ícone e ninguém escolhia cor — quem via
 * "Biologia" na home e "Biologia" no painel via duas coisas diferentes.
 */
export function SubjectsSection() {
  return (
    <section id="disciplinas" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="t-display text-text-primary">Disciplinas</h2>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-text-secondary">
          Conteúdo organizado em Disciplina → Módulo → Aula, cobrindo exatamente o que cai nos
          principais vestibulares de Medicina.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {subjects.map((subject) => {
          const visual = visualDaMateria(subject.slug);
          return (
            <article
              key={subject.slug}
              className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-xs"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: visual.cor }}
              />
              <div className="flex items-start justify-between gap-3">
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
                {visual.ilustracao && (
                  <Image
                    src={visual.ilustracao}
                    alt=""
                    aria-hidden
                    width={80}
                    height={60}
                    className="h-auto w-16 opacity-90"
                  />
                )}
              </div>
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
