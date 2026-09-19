import Image from "next/image";
import { teachers } from "@/features/marketing/content";
import { CabecalhoDeSecao } from "./secao";

/**
 * Iniciais de quem tem título no nome.
 *
 * Era `name.slice(0, 2)`, que em "Prof. João Ávila" devolve "Pr" — e como a
 * foto apontava para um arquivo inexistente, o card caía justamente nesse
 * fallback. Descartar os títulos e pegar a inicial do primeiro e do último
 * nome dá "JA", que é o que se espera ver.
 *
 * É por isso que este arquivo não usa o `InitialsAvatar` de `components/ui`:
 * aquele pega as duas primeiras palavras com mais de uma letra, o que aqui
 * devolveria "PJ" (de "Prof." + "João").
 */
function iniciais(nome: string) {
  const TITULOS = /^(prof(a|\.|essor|essora)?|dr(a|\.)?|me\.|ms\.|phd)$/i;
  const partes = nome
    .split(/\s+/)
    .filter((p) => p.length > 0 && !TITULOS.test(p.replace(/\.$/, "")));
  if (partes.length === 0) return nome.slice(0, 2).toUpperCase();
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  // Sem acento: "João Ávila" dava "JÁ", que se lê como palavra e não como
  // monograma. O que se quer no disco é "JA".
  return (primeira + ultima)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase();
}

export function TeachersSection() {
  // Com um professor só, uma grade de três colunas deixa dois terços da faixa
  // vazios e a seção parece quebrada. Abaixo de três, o card vira horizontal e
  // ocupa uma medida de leitura — proposital, não sobra.
  const sozinho = teachers.length === 1;

  return (
    <section id="professores" className="secao-vitrine bg-surface-subtle">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <CabecalhoDeSecao
          sobretitulo="Quem ensina"
          titulo="Professores"
          descricao="Quem prepara as aulas, corrige as questões e atende nos plantões ao vivo."
        />

        <div
          className={
            sozinho
              ? "mx-auto mt-12 max-w-2xl"
              : "mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {teachers.map((teacher) => (
            <article
              key={teacher.name}
              className={`cartao cartao-p-lg flex gap-5 ${sozinho ? "flex-col sm:flex-row sm:items-start" : "flex-col"}`}
            >
              {/* `photo` é opcional: apontar para um arquivo que não existe em
                  public/ gerava 404 no console e caía no fallback de iniciais. */}
              {teacher.photo ? (
                <Image
                  src={teacher.photo}
                  alt=""
                  width={80}
                  height={80}
                  className="size-20 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="inline-flex size-20 shrink-0 items-center justify-center rounded-2xl bg-brand-100 font-display text-2xl font-semibold text-brand-800"
                >
                  {iniciais(teacher.name)}
                </span>
              )}

              <div className="min-w-0">
                <h3 className="t-section text-text-primary">{teacher.name}</h3>
                <p className="t-eyebrow mt-1.5 text-brand-600">{teacher.role}</p>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-text-secondary">
                  {teacher.bio}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
