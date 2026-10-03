import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  FileText,
  Library,
  PlayCircle,
  Target,
  TrendingUp,
  Video,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { diasAte } from "@/lib/datas";
import { visualDaMateria } from "@/lib/materias";
import { planoDoAluno } from "@/features/study-plan/queries";
import { continuarDe, progressoDasDisciplinas, resumoDaSemana } from "@/features/dashboard/queries";
import { SectionHeading } from "@/components/ui/page-header";
import { MetricCard, ProgressBar } from "@/components/ui/metric-card";
import { ActionCard, IconTile } from "@/components/ui/surface";
import { EmptyState } from "@/components/ui/empty-state";
import { Tag } from "@/components/ui/chip";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Início — DespolarizaMED" };

/** "Boa noite" às 22h e "bom dia" às 7h — o aluno estuda nos dois. */
function saudacao(agora: Date) {
  const h = agora.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function minutos(segundos: number | null) {
  if (!segundos || segundos <= 0) return null;
  return `${Math.round(segundos / 60)} min`;
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const alunoId = session!.user.id;

  const [continuacao, disciplinas, semana, plano] = await Promise.all([
    continuarDe(alunoId),
    progressoDasDisciplinas(alunoId),
    resumoDaSemana(alunoId),
    planoDoAluno(alunoId),
  ]);

  const primeiroNome = session!.user.name.split(" ")[0];
  const comAulas = disciplinas.filter((d) => d.totalAulas > 0);
  const diasDeProva = plano?.examDate ? diasAte(plano.examDate) : null;
  const visualContinuacao = visualDaMateria(continuacao?.disciplina?.nome);

  return (
    <>
      {/* ------------------------------------------------------------------
          Continuidade. É a primeira coisa da tela porque é a primeira decisão
          do aluno ao abrir a plataforma: "o que eu faço agora?". Antes o topo
          era só a saudação e logo abaixo vinha uma grade de oito cartões
          iguais, que empurra essa decisão para ele.
          ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-surface to-surface">
        {/* Trama do axônio do emblema, quase invisível: textura da marca em vez
            de gradiente genérico. */}
        <div
          aria-hidden
          className="trama-axonio pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom_right,black,transparent_65%)]"
        />

        <div className="relative grid gap-6 cartao-p-lg lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8">
          <div className="min-w-0">
            <h1 className="t-display text-text-primary">
              {saudacao(new Date())}, {primeiroNome}.
            </h1>
            <p className="mt-2 max-w-[48ch] text-[1.0625rem] text-text-secondary">
              {continuacao
                ? continuacao.primeiraVez
                  ? "Sua preparação começa aqui. A primeira aula já está pronta."
                  : "Sua preparação continua daqui."
                : "Assim que as aulas forem publicadas, elas aparecem aqui."}
            </p>

            {continuacao ? (
              <div className="mt-6 cartao cartao-p-md">
                {/* Coluna no celular, linha a partir de `sm`. Com `flex-wrap` e
                    três filhos na mesma linha, em 390px o bloco de texto ficava
                    com ~150px e o título da aula quebrava em quatro linhas por
                    baixo do botão. */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <IconTile
                      icone={visualContinuacao.icone}
                      cor={visualContinuacao.cor}
                      tamanho="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {continuacao.disciplina && (
                          <Tag tom="materia" cor={visualContinuacao.cor}>
                            {continuacao.disciplina.nome}
                          </Tag>
                        )}
                        {continuacao.modulo && <span className="t-meta">{continuacao.modulo}</span>}
                        {minutos(continuacao.aula.duracaoSegundos) && (
                          <span className="t-meta">
                            · {minutos(continuacao.aula.duracaoSegundos)}
                          </span>
                        )}
                      </div>
                      <p className="t-card-title mt-1.5 text-text-primary">
                        {continuacao.aula.titulo}
                      </p>

                      {/* A barra só aparece quando existe posição salva E duração
                          conhecida. Sem os dois, uma barra desenhada seria um
                          número inventado. */}
                      {continuacao.posicaoSegundos > 0 && continuacao.aula.duracaoSegundos ? (
                        <div className="mt-3 flex items-center gap-3">
                          <ProgressBar
                            valor={continuacao.posicaoSegundos}
                            total={continuacao.aula.duracaoSegundos}
                            cor={visualContinuacao.cor}
                            rotulo={`Progresso em ${continuacao.aula.titulo}`}
                            className="max-w-xs"
                          />
                          <span className="t-meta tabular shrink-0">
                          {Math.round(
                            (continuacao.posicaoSegundos / continuacao.aula.duracaoSegundos) * 100,
                          )}
                          %
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <Link
                    href={`/aulas/${continuacao.aula.slug}`}
                    className={buttonVariants({ size: "lg",
                      className: "w-full shrink-0 sm:w-auto",
                    })}
                  >
                    <PlayCircle data-icon="inline-start" aria-hidden />
                    {continuacao.posicaoSegundos > 0 ? "Continuar aula" : "Começar aula"}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <Link href="/questoes" className={buttonVariants({ size: "lg" })}>
                  <CircleHelp data-icon="inline-start" aria-hidden />
                  Ir para o banco de questões
                </Link>
              </div>
            )}
          </div>

          {/* Ilustração científica, não foto de pessoa: é o universo visual da
              marca (o neurônio despolarizando do emblema) e não um retrato de
              banco de imagens que qualquer plataforma poderia usar. */}
          <Image
            src="/illustrations/marca-axonio.svg"
            alt=""
            aria-hidden
            width={300}
            height={167}
            priority
            className="hidden h-auto w-[18rem] justify-self-end lg:block"
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------
          Progresso da semana
          ------------------------------------------------------------------ */}
      <section className="secao">
        <SectionHeading
          icone={TrendingUp}
          acao={
            <Link href="/desempenho" className="font-medium text-brand-600 hover:underline">
              Ver desempenho completo →
            </Link>
          }
        >
          Sua semana
        </SectionHeading>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icone={PlayCircle}
            rotulo="Aulas concluídas"
            valor={semana.aulasConcluidas}
            apoio="nos últimos 7 dias"
            // Teal e laranja da marca nos dois primeiros, como os números da
            // versão do Paulo: decoração de identidade, não de significado — o
            // único cartão cuja cor SIGNIFICA algo é a taxa de acerto.
            cor="var(--brand-teal-texto)"
          />
          <MetricCard
            icone={CircleHelp}
            rotulo="Questões respondidas"
            valor={semana.questoesRespondidas.toLocaleString("pt-BR")}
            apoio="nos últimos 7 dias"
            href="/questoes"
            cor="var(--brand-orange-texto)"
          />
          <MetricCard
            icone={Target}
            rotulo="Taxa de acerto"
            valor={semana.taxaAcerto === null ? "—" : `${semana.taxaAcerto}%`}
            apoio={
              semana.taxaAcerto === null
                ? "responda uma questão para medir"
                : `${semana.acertos} de ${semana.questoesRespondidas}`
            }
            tom={
              semana.taxaAcerto === null
                ? "neutro"
                : semana.taxaAcerto >= 70
                  ? "positivo"
                  : semana.taxaAcerto >= 50
                    ? "atencao"
                    : "negativo"
            }
          />
          {/* O quarto cartão só existe se houver plano: sem data de prova não
              há "faltam N dias" que seja verdade. */}
          {plano && diasDeProva !== null ? (
            <MetricCard
              icone={CalendarCheck}
              rotulo={`Faltam para ${plano.targetVestibular ?? "a prova"}`}
              valor={diasDeProva}
              apoio={diasDeProva === 1 ? "dia" : "dias"}
              href="/plano"
            />
          ) : (
            <ActionCard href="/plano" icone={CalendarCheck} titulo="Monte seu plano">
              Diga a data da prova e montamos o cronograma.
            </ActionCard>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------
          Continue estudando — disciplinas com progresso real
          ------------------------------------------------------------------ */}
      <section className="secao">
        <SectionHeading
          icone={Library}
          acao={
            <Link href="/disciplinas" className="font-medium text-brand-600 hover:underline">
              Todas as disciplinas →
            </Link>
          }
        >
          Continue estudando
        </SectionHeading>

        {comAulas.length === 0 ? (
          <EmptyState
            ilustracao="/illustrations/vazio-conteudo.svg"
            titulo="Nenhuma aula publicada ainda"
            descricao="Assim que a equipe publicar a primeira aula, ela aparece aqui com o seu progresso."
            acao={
              <Link href="/questoes" className={buttonVariants({ variant: "outline" })}>
                Enquanto isso, resolver questões
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {comAulas.map(({ disciplina, totalAulas, concluidas, proxima }) => {
              const visual = visualDaMateria(disciplina.slug || disciplina.name);
              return (
                <li key={disciplina.id}>
                  <Link
                    href={`/disciplinas/${disciplina.slug}`}
                    className="flex h-full flex-col cartao cartao-p-md cartao-interativo"
                  >
                    <div className="flex items-start gap-3">
                      <IconTile icone={visual.icone} cor={visual.cor} />
                      <div className="min-w-0 flex-1">
                        <p className="t-card-title text-text-primary">{disciplina.name}</p>
                        <p className="t-meta tabular">
                          {concluidas} de {totalAulas} {totalAulas === 1 ? "aula" : "aulas"}
                        </p>
                      </div>
                      <span
                        className="tabular shrink-0 text-[0.9375rem] font-semibold"
                        style={{ color: visual.cor }}
                      >
                        {Math.round((concluidas / totalAulas) * 100)}%
                      </span>
                    </div>

                    <ProgressBar
                      valor={concluidas}
                      total={totalAulas}
                      cor={visual.cor}
                      rotulo={`Progresso em ${disciplina.name}`}
                      className="mt-4"
                    />

                    <p className="mt-4 flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-600">
                      {proxima ? (
                        <>
                          <PlayCircle aria-hidden className="size-4 shrink-0" />
                          <span className="min-w-0 truncate">{proxima.titulo}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" />
                          <span className="text-success-text">Disciplina concluída</span>
                        </>
                      )}
                      <ArrowRight aria-hidden className="ml-auto size-4 shrink-0" />
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------------------
          Acessos rápidos — cartões menores, peso menor. É a última seção de
          propósito: são atalhos, não a tarefa do dia.
          ------------------------------------------------------------------ */}
      <section className="secao">
        <SectionHeading>Acessos rápidos</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ActionCard href="/questoes" icone={CircleHelp} titulo="Banco de questões">
            Questões de vestibular filtradas por banca, ano, disciplina e tema.
          </ActionCard>
          <ActionCard href="/provas" icone={FileText} titulo="Provas antigas">
            Resolva a prova inteira e veja seus pontos fortes no final.
          </ActionCard>
          <ActionCard href="/plantoes" icone={Video} titulo="Plantões e palestras">
            Tire dúvidas ao vivo com os professores pelo Google Meet.
          </ActionCard>
          <ActionCard href="/calendario" icone={CalendarDays} titulo="Calendário">
            Cronograma, plantões, palestras e a data da sua prova.
          </ActionCard>
        </div>
      </section>
    </>
  );
}
