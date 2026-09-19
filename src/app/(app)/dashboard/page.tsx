import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  FileStack,
  Gauge,
  History,
  ListChecks,
  PlayCircle,
  Target,
  TrendingUp,
  Video,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getSubjects } from "@/lib/payload/queries";
import { continuarEstudando, progressoDasDisciplinas, resumoDaSemana } from "@/features/courses/queries";
import { visualDaDisciplina } from "@/lib/subjects-visual";
import { SubjectIcon } from "@/components/subject-icon";
import { IllustrationDna } from "@/components/illustrations";
import { MetricCard, ProgressBar } from "@/components/metric-card";
import { PageShell, SectionHeading } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Início — DespolarizaMED" };

/**
 * Início do aluno.
 *
 * O que havia antes era uma grade de oito cards do mesmo tamanho: disciplina,
 * banco de questões, provas, desempenho, plano, plantões, glossário e
 * atividades, todos iguais, todos com o mesmo peso. Sem hierarquia, a tela
 * vira um menu com cara de card, e o aluno que abre o app às 22h para estudar
 * precisa decidir por onde começar em vez de simplesmente continuar.
 *
 * Agora a página responde a uma pergunta só, logo no topo: o que eu estava
 * estudando. O resto desce de importância na ordem em que é procurado.
 */
export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const studentId = session?.user.id;

  const [subjects, continuacao, progresso, semana] = await Promise.all([
    getSubjects(),
    studentId ? continuarEstudando(studentId) : Promise.resolve(null),
    progressoDasDisciplinas(studentId),
    studentId ? resumoDaSemana(studentId) : Promise.resolve(null),
  ]);

  const primeiroNome = (session?.user.name ?? "").trim().split(/\s+/)[0] || "aluno";
  const temSemana = Boolean(semana && (semana.aulasConcluidas > 0 || semana.questoesRespondidas > 0));

  return (
    <PageShell largura="larga">
      <p className="text-sm font-medium text-muted-foreground">{saudacao()}, {primeiroNome}.</p>
      <h1 className="mt-1 font-heading text-2xl leading-tight font-semibold text-foreground sm:text-3xl">
        {continuacao ? "Sua preparação continua daqui." : "Bem-vindo à sua preparação."}
      </h1>

      {continuacao ? (
        <CardContinuar continuacao={continuacao} />
      ) : (
        <div className="mt-6">
          <EmptyState
            tamanho="compacto"
            ilustracao={<IllustrationDna />}
            titulo="Nenhuma aula publicada ainda"
            descricao="Assim que a primeira aula entrar no ar ela aparece aqui, e o botão leva direto para o ponto em que você parou."
            acao={
              <Button render={<Link href="/questoes" />}>
                Ir para o banco de questões
                <ArrowRight />
              </Button>
            }
          />
        </div>
      )}

      {temSemana && semana && (
        <section className="mt-10">
          <SectionHeading titulo="Sua semana" icone={TrendingUp} />
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              rotulo="Aulas concluídas"
              valor={semana.aulasConcluidas}
              apoio="nos últimos 7 dias"
              icone={CheckCircle2}
            />
            <MetricCard
              rotulo="Questões respondidas"
              valor={semana.questoesRespondidas.toLocaleString("pt-BR")}
              apoio="nos últimos 7 dias"
              icone={ListChecks}
            />
            <MetricCard
              rotulo="Taxa de acerto"
              // null quando não respondeu nada na semana, e aí o card não entra:
              // mostrar 0% diria que errou tudo, que é diferente de não ter feito.
              valor={semana.taxaAcerto === null ? "sem dados" : `${semana.taxaAcerto}%`}
              apoio={semana.taxaAcerto === null ? "responda questões para medir" : `${semana.acertos} acertos`}
              icone={Target}
            />
          </div>
        </section>
      )}

      {subjects.length > 0 && (
        <section className="mt-10">
          <SectionHeading
            titulo="Continue estudando"
            icone={PlayCircle}
            acao={
              <Link href="/disciplinas" className="text-sm font-medium text-primary hover:underline">
                Ver todas
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {subjects.slice(0, 6).map((subject) => (
              <CardDisciplina
                key={subject.id}
                nome={subject.name}
                slug={subject.slug}
                descricao={subject.description}
                progresso={progresso.get(subject.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <SectionHeading titulo="Acessos rápidos" />
        {/* Lista compacta, não oito cards do tamanho de um card de disciplina:
            são atalhos, e atalho que ocupa o mesmo espaço do conteúdo compete
            com ele. */}
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <Atalho href="/questoes" icone={ListChecks} titulo="Banco de questões" apoio="Filtre por banca, ano e tema" />
          <Atalho href="/provas" icone={FileStack} titulo="Provas antigas" apoio="Resolva provas completas" />
          <Atalho href="/plano" icone={Target} titulo="Plano de estudos" apoio="Cronograma até a sua prova" />
          <Atalho href="/plantoes" icone={Video} titulo="Plantões e palestras" apoio="Tire dúvidas ao vivo" />
          <Atalho href="/calendario" icone={CalendarDays} titulo="Calendário" apoio="Tudo em um lugar só" />
          <Atalho href="/desempenho" icone={Gauge} titulo="Desempenho" apoio="Acertos por disciplina e tema" />
          <Atalho href="/glossario" icone={BookMarked} titulo="Glossário" apoio="Termos escritos pela equipe" />
          <Atalho href="/atividades" icone={History} titulo="Atividades" apoio="Seu histórico" />
        </div>
      </section>
    </PageShell>
  );
}

/**
 * Saudação pelo horário de Brasília, e não pelo do servidor: o container roda
 * em UTC, então sem o fuso explícito o aluno lê "boa tarde" às 22h.
 */
function saudacao() {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(
      new Date(),
    ),
  );
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function CardContinuar({
  continuacao,
}: {
  continuacao: NonNullable<Awaited<ReturnType<typeof continuarEstudando>>>;
}) {
  const { aula, disciplina, modulo, posicaoSegundos, primeira } = continuacao;
  const duracao = aula.durationSeconds ?? 0;
  const assistido = duracao > 0 ? Math.min(posicaoSegundos, duracao) : 0;
  const { corVar } = visualDaDisciplina(disciplina?.name);

  return (
    <div
      className="relative mt-6 overflow-hidden rounded-2xl bg-card p-6 shadow-xs ring-1 ring-foreground/8 sm:p-8"
      // O único gradiente da área logada, e mesmo assim quase imperceptível:
      // marca o bloco de continuidade como o lugar para onde o olho vai
      // primeiro, sem virar banner colorido.
      style={{
        backgroundImage: `linear-gradient(120deg, color-mix(in oklch, var(${corVar}), transparent 94%), transparent 60%)`,
      }}
    >
      {/* Ilustração científica de linha no lugar de foto de pessoa estudando:
          é o assunto do produto, não uma cena genérica. Sai no mobile, onde
          roubaria a largura do texto. */}
      <IllustrationDna
        className="pointer-events-none absolute -top-6 right-2 hidden h-48 w-auto text-foreground/[0.06] sm:block"
        aria-hidden
      />
      <div className="relative max-w-2xl">
        <div className="flex items-center gap-3">
          <SubjectIcon disciplina={disciplina?.name} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: `var(${corVar})` }}>
              {disciplina?.name ?? "Aula"}
            </p>
            {modulo && <p className="truncate text-sm text-muted-foreground">{modulo.name}</p>}
          </div>
        </div>

        <h2 className="mt-4 font-heading text-xl leading-snug font-semibold text-foreground sm:text-2xl">
          {aula.title}
        </h2>
        {aula.description && (
          <p className="mt-2 line-clamp-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
            {aula.description}
          </p>
        )}

        {/* Barra só quando há duração e algo assistido. Sem os dois, uma barra
            em 0% sugere um progresso que não foi medido. */}
        {duracao > 0 && assistido > 0 && (
          <div className="mt-5 max-w-md">
            <ProgressBar
              valor={assistido}
              total={duracao}
              cor={corVar}
              rotuloAcessivel={`${minutos(assistido)} de ${minutos(duracao)} assistidos`}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {minutos(assistido)} de {minutos(duracao)} assistidos
            </p>
          </div>
        )}

        <div className="mt-6">
          <Button size="lg" render={<Link href={`/aulas/${aula.slug}`} />}>
            <PlayCircle />
            {primeira || assistido === 0 ? "Começar a aula" : "Continuar aula"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function minutos(segundos: number) {
  const m = Math.round(segundos / 60);
  return `${m} min`;
}

function CardDisciplina({
  nome,
  slug,
  descricao,
  progresso,
}: {
  nome: string;
  slug: string;
  descricao?: string | null;
  progresso?: { totalAulas: number; concluidas: number; totalModulos: number };
}) {
  const { corVar } = visualDaDisciplina(nome);
  return (
    <Link
      href={`/disciplinas/${slug}`}
      className="group flex flex-col rounded-xl bg-card p-5 shadow-xs ring-1 ring-foreground/8 transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none"
    >
      <SubjectIcon disciplina={nome} size="lg" />
      <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">{nome}</h3>
      {descricao && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{descricao}</p>}

      {progresso && progresso.totalAulas > 0 && (
        <>
          <p className="mt-3 text-xs text-muted-foreground">
            {progresso.totalAulas} {progresso.totalAulas === 1 ? "aula" : "aulas"}
            {progresso.totalModulos > 0 && (
              <>
                {" · "}
                {progresso.totalModulos} {progresso.totalModulos === 1 ? "módulo" : "módulos"}
              </>
            )}
          </p>
          <div className="mt-3">
            <ProgressBar
              valor={progresso.concluidas}
              total={progresso.totalAulas}
              cor={corVar}
              altura="fina"
              rotuloAcessivel={`${progresso.concluidas} de ${progresso.totalAulas} aulas concluídas`}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {progresso.concluidas} de {progresso.totalAulas} concluídas
            </p>
          </div>
        </>
      )}

      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Continuar
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
      </span>
    </Link>
  );
}

function Atalho({
  href,
  icone: Icone,
  titulo,
  apoio,
}: {
  href: string;
  icone: React.ComponentType<{ className?: string }>;
  titulo: string;
  apoio: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-xs ring-1 ring-foreground/8 transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary [&>svg]:size-[1.125rem]"
        aria-hidden
      >
        <Icone />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{titulo}</span>
        <span className="block truncate text-xs text-muted-foreground">{apoio}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </Link>
  );
}
