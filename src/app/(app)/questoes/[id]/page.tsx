import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, Image as ImageIcon, Info, Quote } from "lucide-react";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { obterQuestao } from "@/features/library/queries";
import { idsFavoritas, ultimasRespostas } from "@/features/practice/queries";
import { QuestionCard } from "@/features/library/components/question-card";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { Tag } from "@/components/ui/chip";
import { visualDaMateria } from "@/lib/materias";

export const metadata: Metadata = { title: "Questão — DespolarizaMED" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function QuestaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, role } = await requireAssinatura();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const q = await obterQuestao(id);
  // Questão não validada não é servida ao aluno, nem por link direto. Quem
  // revisa (ADMIN/TEACHER) precisa enxergá-la para decidir.
  const revisor = role === "ADMIN" || role === "TEACHER";
  if (!q || (!q.validada && !revisor)) notFound();

  const [respostas, favoritas] = await Promise.all([
    ultimasRespostas(session.user.id, [id]),
    idsFavoritas(session.user.id, "QUESTION"),
  ]);

  const visual = visualDaMateria(q.disciplinaSugerida);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        migalhas={[
          { rotulo: "Banco de questões", href: "/questoes" },
          { rotulo: `${q.instituicaoSlug?.toUpperCase() ?? "Questão"} ${q.ano ?? ""}`.trim() },
        ]}
        titulo={
          <>
            {q.instituicaoSlug?.toUpperCase()} {q.ano}
            {q.numero ? (
              <span className="text-text-muted"> · Questão {q.numero}</span>
            ) : null}
          </>
        }
        aside={
          <div className="flex flex-wrap items-center gap-2">
            {q.fase && <Tag tom="neutro">{q.fase}</Tag>}
            {q.curso && <Tag tom="neutro">{q.curso}</Tag>}
            {q.banca && <Tag tom="marca">banca {q.banca}</Tag>}
            {q.disciplinaSugerida && (
              <Tag tom="materia" cor={visual.cor} icone={visual.icone}>
                {q.disciplinaSugerida}
              </Tag>
            )}
          </div>
        }
      />

      {!q.validada && (
        <p
          role="status"
          className="mb-6 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-[0.875rem] text-danger-text"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong className="font-semibold">Questão não validada.</strong> Visível só para
            revisores — o aluno recebe 404 nesta URL.
          </span>
        </p>
      )}

      {q.contexto && (
        <section className="mb-6 cartao cartao-p-md border-l-[3px] border-l-brand-400">
          <h2 className="t-eyebrow mb-2 flex items-center gap-1.5">
            <Quote aria-hidden className="size-3.5" />
            Texto-base (questão {q.contextoNumero})
          </h2>
          <p className="t-leitura whitespace-pre-line text-text-secondary">{q.contexto}</p>
        </section>
      )}

      {q.figuras.length > 0 && (
        <section className="mb-6">
          <SectionHeading icone={ImageIcon}>
            {q.figuras.length === 1 ? "Figura da questão" : "Figuras da questão"}
          </SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            {q.figuras.map((f) => (
              // eslint-disable-next-line @next/next/no-img-element -- rota autenticada, sem otimização do Next
              <img
                key={f.id}
                src={`/api/figuras/${f.arquivo}`}
                alt={`Figura ${f.indice + 1} da questão ${q.numero ?? ""}`}
                width={f.larguraPx ?? undefined}
                height={f.alturaPx ?? undefined}
                loading="lazy"
                className="max-w-full rounded-xl border border-border bg-white"
              />
            ))}
          </div>
        </section>
      )}

      <QuestionCard
        mostrarLinkDetalhe={false}
        questao={{
          id: q.id,
          enunciado: q.enunciado,
          numero: q.numero,
          ano: q.ano,
          instituicaoSlug: q.instituicaoSlug,
          disciplinaSugerida: q.disciplinaSugerida,
          alternativas: q.alternativas.map((a) => ({ letra: a.letra, texto: a.texto })),
          respostaAnterior: respostas.get(q.id) ?? null,
          favorita: favoritas.includes(q.id),
        }}
      />

      {q.temaSugerido && (
        <p className="t-meta mt-5 flex items-start gap-2 rounded-lg border border-border bg-surface-subtle/60 px-4 py-3">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Tema sugerido: <strong className="text-text-secondary">{q.temaSugerido}</strong>.
            Classificação automática — ainda não revisada por um professor, e pode estar errada.
          </span>
        </p>
      )}
    </div>
  );
}
