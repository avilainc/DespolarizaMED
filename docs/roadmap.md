# Roadmap: DespolarizaMED

Este documento é a fonte de verdade sobre **o que já existe, o que está decidido e o que falta**. Qualquer agente ou dev que entrar no projeto deve ler isto antes de tocar em código, para não refazer decisões já tomadas ou reintroduzir problemas já resolvidos.

Para a visão de produto completa (o que cada tela faz, jornada do usuário, modelo de negócio), ver [`docs/product-plan.md`](./product-plan.md), este roadmap foca em **execução técnica**.

---

## 1. Stack decidida (não reabrir sem motivo forte)

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Ver [Bloqueios](#3-bloqueios-conhecidos), Next 16 foi tentado primeiro e revertido. |
| Package manager | pnpm | Decisão do usuário. |
| Database | PostgreSQL (local: `despolarizamed`, user/pass `postgres`/`postgres`) | Já rodando localmente na porta 5432. |
| ORM (dados transacionais) | Drizzle ORM | Sem codegen, type-safe, controle direto de SQL. Ver [seção 2](#2-decisão-payload-vs-drizzle--quem-é-dono-de-qual-tabela). |
| CMS (conteúdo educacional) | Payload CMS 3.x | Admin UI pronta para professor cadastrar aula sem mexer em código (requisito do produto). Ver [seção 2](#2-decisão-payload-vs-drizzle--quem-é-dono-de-qual-tabela) e [Bloqueios](#3-bloqueios-conhecidos). |
| Auth | Better Auth | NextAuth/Auth.js está em modo manutenção desde set/2025; Better Auth tem RBAC nativo via campo `role` custom. |
| Auth do painel Payload | Nativa do Payload (collection `Staff`), **separada** do Better Auth | Simplicidade: 2 sistemas de login (aluno via Better Auth, staff via Payload) até que unificar valha o esforço. |
| Fila / jobs | BullMQ + Redis | Padrão de mercado para Node; usado para vídeo, transcrição, e-mail. |
| Vídeo | FFmpeg + fluent-ffmpeg (worker próprio) | Sem solução open-source pronta boa o suficiente; ver `product-plan.md` seção 26. |
| Transcrição | faster-whisper (+ Speaches como servidor HTTP) | Mais rápido que Whisper original, roda em CPU no VPS. |
| Editor de questões | TipTap + KaTeX + `@aarkue/tiptap-math-extension` | Suporta LaTeX (física/química) sem depender do plugin pago da TipTap. |
| Player de vídeo | Vidstack (`@vidstack/react`) | Mais moderno que Video.js, suporte nativo a HLS/legendas/resume. |
| Calendário | react-big-calendar | 100% MIT, sem paywall (ao contrário do FullCalendar em features avançadas). |
| Busca | Postgres full-text search nativo no MVP; Meilisearch quando crescer | Zero infra extra no início. |
| Pagamentos | Mercado Pago | Gateway brasileiro, requisito do produto. |
| E-mail | `mail.avilaops.com` (MTA próprio, SMTP submission na 587) | Provedor do catálogo da casa, como manda o padrão. Resend foi descartado: não usamos serviço de e-mail de terceiro. |
| Automação | n8n | Já decidido antes deste roadmap. |
| Deploy | VPS próprio (Hetzner) | Já decidido antes deste roadmap. |

**Rejeitado conscientemente:**
- **Frappe Education / Frappe LMS**, avaliado e descartado. Motivos: banco de questões/simulados estilo vestibular não existe pronto (seria construído do zero de qualquer forma), sem integração Mercado Pago, sem Google Meet nativo, `frappe/lms` é AGPL-3.0 (risco jurídico para SaaS pago), e trocaria 100% da stack (Python/Vue) abandonando o conhecimento já acumulado em Next.js/TS.
- **NextAuth/Auth.js**, em modo só-patch de segurança desde set/2025.
- **Directus**, licença BSL restritiva para uso comercial via self-host.
- **Typesense**, GPL-3 (copyleft mais restritivo que Meilisearch/MIT).

---

## 2. Decisão: Payload vs Drizzle: quem é dono de qual tabela

Esta é a decisão arquitetural mais importante do projeto e a mais fácil de violar por engano. **Nunca crie a mesma entidade nos dois lados.**

### Payload CMS é dono de (conteúdo editorial, gerenciado via `/admin`):
- `subjects`, `modules`, `lessons`, `lesson-materials`, `captions`, `transcripts`, `glossary-terms`, `media`
- Collections em `src/payload/collections/*.ts`, config em `src/payload/payload.config.ts`.
- Payload gera e é dono do próprio schema Postgres a partir dessas collections (IDs `integer` seriais, não UUID).

### Drizzle é dono de (dados transacionais, sem necessidade de admin UI visual):
- **Auth**: `users`, `sessions`, `accounts`, `verifications` (schema do Better Auth), `src/lib/db/schema/auth.ts`
- **Questões/Provas**: `questions`, `question_options`, `exercise_lists`, `exercise_list_questions`, `exams`, `exam_questions`, `exam_attempts`, `exam_answers` - `src/lib/db/schema/questions.ts` e `exams.ts`
- **Aprendizado**: `lesson_progress`, `student_progress`, `study_plans`, `study_plan_items`, `student_activities`, `student_notes`, `favorites` - `src/lib/db/schema/learning.ts`
- **Eventos/calendário**: `live_sessions`, `lectures`, `events` - `src/lib/db/schema/events.ts`
- **Billing**: `plans`, `subscriptions`, `payments`, `coupons`, `payment_events` - `src/lib/db/schema/billing.ts`
- **Acervo de provas (extraído por pipeline)**: `source_documents`, `document_pages`, `library_questions`, `library_question_options`, `library_figures` - `src/lib/db/schema/library.ts`. Populado por `scripts/pdf-ingest/*` (ver `docs/acervo-provas.md`). Só sai para o aluno o que está `validada = true` e sem `duplicata_de`.
- **Prática do aluno**: `practice_attempts` (uma prova resolvida), `practice_answers` (cada resposta, avulsa ou dentro de uma prova) - `src/lib/db/schema/practice.ts`. Apontam para `library_questions`, **não** para `questions`: o acervo é o que está no ar, e esperar a curadoria de 26 mil questões deixaria o aluno sem histórico.

### `questions` (curada) × `library_questions` (extraída)
São duas fontes de propósito. `library_questions` tem volume (26 mil, com figuras e gabarito conferido) mas disciplina/tema apenas *sugeridos* por classificador. `questions` é escrita pelo professor no editor (TipTap + KaTeX, `/professor/questoes`) com disciplina e tema curados. O aluno vê as duas: `/questoes` (acervo, com histórico de respostas) e `/questoes/autorais` (curadas, sem histórico por enquanto). Promover uma questão do acervo para `questions` é passo humano, ainda sem tela.

### Regra prática ao referenciar uma entidade do Payload a partir do Drizzle:
Payload usa `integer` (serial) como tipo de ID. Ao referenciar (ex: `questions.subjectId` apontando pra `subjects` do Payload), use uma coluna `integer` **sem** foreign key do Drizzle (Drizzle não pode ter FK para uma tabela que ele não gerencia). Exemplo já aplicado em `src/lib/db/schema/questions.ts`:

```ts
// subjectId references Payload's "subjects" collection (owned by Payload, not a Drizzle FK).
subjectId: integer("subject_id").notNull(),
```

Se essa arquitetura de "dois donos de schema no mesmo Postgres" se mostrar dolorosa na prática (ex: falta de integridade referencial real), a alternativa é migrar o conteúdo educacional para dentro do schema Drizzle e construir telas de admin simples em Next.js, mas isso é retrabalho grande, só reconsiderar se houver dor real, não preventivamente.

---

## 3. Bloqueios conhecidos

### [RESOLVIDO 2026-08-07] Payload 3.87 incompatível com Next.js 16
Next.js 16 mudou o formato de export do pacote `@next/env` (CJS puro via `module.exports = n`, sem `.default`). O Payload 3.87 (`payload/dist/bin/loadEnv.js`) faz `import nextEnvImport from '@next/env'` contando com interop ESM/CJS que só funciona quando o *consumidor* também roda como ESM real dentro do pipeline do Next, no runtime standalone (CLI, scripts via `tsx`) essa interop falha com `Cannot destructure property 'loadEnvConfig' of 'import_env.default' as it is undefined`.

**Decisão**: downgrade para **Next.js 15.5.x** (`next@15`, `eslint-config-next@15`), versão testada/suportada pelo Payload 3.x. Confirmado por build completo (`pnpm build`, `.next` limpo) que todas as rotas do Payload e Better Auth são reconhecidas corretamente nesta combinação. Antes de subir para Next 16 de novo no futuro, checar se o Payload já lançou suporte oficial.

Ajustes feitos por causa do downgrade:

- `src/app/layout.tsx`: revertido de `LayoutProps<"/">` (tipo global exclusivo do Next 16) para `{ children: React.ReactNode }`.
- `eslint.config.mjs`: reescrito para usar `FlatCompat` (`@eslint/eslintrc`) com `compat.extends("next/core-web-vitals", "next/typescript")` - a forma de import direto (`eslint-config-next/core-web-vitals`) resolvia de modo inconsistente entre o processo principal do Next 15 e o worker de lint, causando erros cosméticos (`Plugin "" not found`, `nextVitals is not iterable`) mesmo com o build passando. `FlatCompat` é a forma oficial recomendada e elimina o problema.

**Se, ao ler isto, o build ainda falhar**: rode `pnpm build` (com `.next` limpo) e confira o output real antes de assumir que segue resolvido, versões de dependências mudam.

### [RESOLVIDO 2026-08-11] Payload CLI/push quebrado em shells não-interativos
O modo dev do Payload (disparado ao acessar `/admin`) chama `drizzle-kit`'s `pushSchema` internamente, que exige um TTY real (`Error: Interactive prompts require a TTY terminal`) mesmo sem warnings de perda de dados, falha em qualquer shell não-interativo (background, `nohup`, `winpty` sem pty de origem, terminal integrado de algumas IDEs). Separadamente, o CLI oficial (`payload migrate:create`, `payload migrate`) falha com `ERR_REQUIRE_ASYNC_MODULE` ao carregar `@payloadcms/richtext-lexical` (usa top-level-await; o bin do Payload tenta `require()` síncrono dele), reproduzido em Node 22 e 24, é bug de como o CLI standalone consome o pacote, não versão de Node.

**Solução aplicada, dois scripts próprios que chamam a API programática do adapter diretamente, contornando o CLI quebrado:**

- `scripts/next-env-shim.cjs`: intercepta `Module._load` para adicionar `.default` ao módulo `@next/env` quando ausente. Necessário porque `payload/dist/bin/loadEnv.js` faz `import nextEnvImport from '@next/env'` assumindo interop ESM/CJS que só funciona dentro do bundler do Next, em runtime standalone (`tsx`/`node`), `@next/env` é CJS puro (`module.exports = n`, sem `.default`) e a desestruturação quebra. Carregado via `node --require`.
- `scripts/gen-migration.mjs`: inicializa o Payload via `getPayload({ config })` e chama `payload.db.createMigration({ forceAcceptWarning: true, migrationName, payload })` - o método real do adapter Postgres (**não** a função solta `createMigration` exportada por `payload`, que é só um fallback genérico com template hardcoded para MongoDB e não gera SQL nenhum). `forceAcceptWarning: true` pula qualquer prompt de confirmação.
- `scripts/run-migrate.mjs`: idem, chamando `payload.db.migrate()` para aplicar as migrations pendentes.
- Env var `PAYLOAD_DISABLE_PUSH=true` (já lida em `payload.config.ts`) desliga o push automático de dev, forçando o fluxo de migrations formais mesmo rodando `pnpm dev`.

**Scripts npm disponíveis** (ver `package.json`):
```bash
pnpm payload:migrate:create <nome>   # gera uma nova migration a partir do diff do schema das collections
pnpm payload:migrate                  # aplica as migrations pendentes no Postgres
```

Ambos funcionam em qualquer shell, incluindo não-interativo, não dependem mais de TTY. A migration inicial (`src/migrations/<timestamp>_init.ts`) já foi gerada e aplicada; todas as 43 tabelas (Payload + Drizzle) existem no Postgres e `/admin/login` responde HTTP 200.

**Nota para o futuro**: sempre que uma collection do Payload mudar (novo campo, nova collection), rodar `pnpm payload:migrate:create <nome-descritivo>` e depois `pnpm payload:migrate` - nunca depender do push automático de dev em produção nem contar com ele funcionar de novo se o TTY não estiver disponível.

### [RESOLVIDO 2026-08-11] `__drizzle_migrations` dessincronizado do banco real
Ao recriar o banco `despolarizamed` manualmente (`DROP DATABASE` / `CREATE DATABASE`) numa sessão anterior de debugging do bloqueio do Payload, a tabela de controle `drizzle.__drizzle_migrations` acabou registrando a migration `0000_tan_alex_power.sql` como já aplicada sem as tabelas (`users`, `sessions`, `questions`, etc.) terem sido de fato recriadas, `pnpm db:migrate` reportava sucesso mas pulava silenciosamente por achar que não havia nada a fazer. Só foi percebido ao testar `POST /api/auth/sign-up/email` de verdade e receber `relation "users" does not exist`.

**Lição**: depois de qualquer `DROP DATABASE`/recreate manual do Postgres em dev, **sempre** testar um fluxo real (não só que a página carrega) antes de considerar a stack funcional, build verde e HTTP 200 não garantem que o schema/dados estão corretos. Se isso acontecer de novo: `DELETE FROM drizzle.__drizzle_migrations;` seguido de `pnpm db:migrate` recria as tabelas do zero (idempotente, seguro em dev sem dados reais).

### [RESOLVIDO 2026-08-11] Tipos incompletos do `@vidstack/react` 0.6.15
O `MediaPlayerElement` exportado por `vidstack` 0.6.15 não expõe `currentTime` (setter), `addEventListener`/`removeEventListener` através da sua cadeia de generics (`HTMLCustomElement<Player>`), mesmo esses existindo em runtime, é uma limitação de tipagem da lib nessa versão, não um erro de uso. Também: os estilos CSS ficam no pacote `vidstack` (`vidstack/styles/base.css`, `vidstack/styles/community-skin/video.css`), não em `@vidstack/react` como a doc mais recente sugere; os componentes desta versão se chamam `MediaPlayer`/`MediaOutlet`/`MediaCommunitySkin` (não `MediaPlayer`/`MediaProvider` como em versões mais novas); atributos HTML nativos como `crossorigin`/`playsinline` devem ir em lowercase (não `crossOrigin`/`playsInline` como no React DOM padrão); os tipos referenciam `hls.js` mesmo sem HLS configurado, então é preciso instalá-lo como devDependency só para o build não quebrar.

**Solução aplicada** em `src/features/courses/components/lesson-player.tsx`: usa `useMediaStore(playerRef)` para ler `canPlay`/`currentTime`/`duration`/`ended` (via store, sempre bem tipado) em vez de `addEventListener`, e um cast pontual e documentado (`player as unknown as { currentTime: number }`) só para o seek inicial de retomar o vídeo de onde o aluno parou.

### [RESOLVIDO 2026-09-17] `timestamp` sem timezone lido com deslocamento de fuso

Reproduzido ao validar `live_sessions` em runtime: um plantão criado às 01:07 (hora local, UTC-3) é escrito corretamente no Postgres (`timestamp without time zone`, literal `2026-09-17 01:07:00` quando o instante UTC real é `04:07:00Z`), mas ao ser **lido de volta** pelo driver `postgres.js`, o valor retornava deslocado em +3h adicionais (`07:07:00Z` em vez de `04:07:00Z`). Causa raiz: o `postgres.js`, ao converter o literal `timestamp` (sem fuso) de volta para `Date`, usa um parsing de string não-ISO ("YYYY-MM-DD HH:mm:ss", sem "T") que o V8 interpreta como **hora local do processo Node**, ignorando a sessão Postgres (que está com `TimeZone=GMT`).

Não quebrava em produção por acaso: a imagem roda em `node:24-slim`, cujo fuso padrão é UTC, e aí a "hora local do processo" coincide com UTC. Quebrava em todo `pnpm dev`/`pnpm start` local no Brasil, e quebraria em produção se algum dia o `TZ` do container fosse setado para `America/Sao_Paulo`.

**Solução aplicada** (migration `0009`):

- **Todas as 53 colunas de instante** do schema Drizzle passaram a ser `timestamptz` (`timestamp(..., { withTimezone: true })`). O Postgres normaliza para UTC internamente e a conversão de volta para `Date` deixa de depender do fuso de quem lê. Não é só `live_sessions`: `study_plan_items.scheduled_for`, `practice_attempts.*`, `sessions.expires_at`, billing, acervo — o schema inteiro.
- **`study_plans.exam_date` virou `date`**, não `timestamptz`: é dia de calendário (vem de um `<input type="date">`), não instante. Guardar um dia como instante é o mesmo erro de categoria por outro caminho — "2026-12-01T00:00:00Z" exibido em hora local no Brasil vira 30/11. O tipo em TypeScript agora é a string `"YYYY-MM-DD"`, e `src/lib/datas.ts` (`chaveDia`, `diaParaData`, `diasAte`) é a única fronteira entre dia de calendário e `Date`. A armadilha que esses helpers existem para evitar: `new Date("2026-12-01")` ancora em UTC.
- **A migration converte com `USING "coluna" AT TIME ZONE 'UTC'` explícito.** Sem isso o Postgres reinterpretaria os literais já gravados usando o `TimeZone` da *sessão que roda a migration*, e todo o histórico sairia deslocado se ela fosse aplicada de um cliente fora de UTC. Os valores existentes são hora UTC (o driver serializa `Date` com offset e a sessão está em UTC).
- **Teste-guarda** em `src/lib/db/schema/fusos.test.ts`: varre o schema inteiro e falha nomeando qualquer coluna `timestamp` sem fuso. Basta esquecer `{ withTimezone: true }` numa coluna nova para reintroduzir o bug em 2 caracteres, e o sintoma é silencioso (build passa, tela carrega) — por isso é teste, não revisão.

**Validado**: instante conhecido gravado com o schema antigo, migration aplicada com o cliente em `America/Sao_Paulo` (pior caso), e conferido que o dado histórico **não** se deslocou e que a leitura passou a bater em UTC e fora dele. Suíte roda em UTC, `America/Sao_Paulo`, `Asia/Tokyo` e `Pacific/Kiritimati` (UTC+14).

**Regra daqui em diante**: instante → `timestamp(..., { withTimezone: true })`; dia de calendário → `date(..., { mode: "string" })` + `src/lib/datas.ts`. Nunca `timestamp` puro.

---

## 4. Estrutura de pastas

```text
src/
├── app/                      # Next.js App Router
│   ├── (payload)/             # Route group isolado do Payload CMS (admin + api REST/GraphQL)
│   │   ├── admin/[[...segments]]/
│   │   └── api/{[...slug],graphql,graphql-playground}/
│   └── api/auth/[...all]/     # Better Auth route handler
├── features/                  # Uma pasta por domínio de produto (UI + lógica client-side)
│   ├── auth/
│   ├── courses/                # consome dados do Payload (subjects/modules/lessons)
│   ├── library/                 # acervo extraído: consultas, card de questão, fila de revisão
│   ├── practice/                # respostas, favoritos, tentativas de prova, desempenho (Drizzle)
│   ├── questions/               # questões autorais: editor TipTap/KaTeX + CRUD do professor
│   ├── exams/                   # (vazio) o fluxo de prova roda em practice/ sobre o acervo
│   ├── study-plan/              # motor de cronograma (engine.ts), plano, calendário (react-big-calendar)
│   ├── live/                    # plantões/palestras: CRUD do professor, aviso por e-mail
│   ├── billing/                 # assinaturas/Mercado Pago (Drizzle)
│   ├── students/                # área do aluno
│   └── admin/                   # dashboard admin do DespolarizaMED (métricas, não conteúdo)
├── lib/
│   ├── auth/                  # Better Auth: config, cliente, RBAC helpers
│   └── db/                    # Drizzle: conexão + schema (uma tabela = um arquivo por domínio)
│       ├── schema/{auth,questions,exams,learning,events,billing}.ts
│       └── migrations/         # geradas por `pnpm db:generate`
├── payload/                   # Payload CMS: config + collections
│   └── collections/{Staff,Media,Subjects,Modules,Lessons,LessonMaterials,Captions,Transcripts,GlossaryTerms}.ts
└── server/
    ├── queue/                 # config do BullMQ/Redis (ainda não implementado)
    └── jobs/                  # workers: vídeo, transcrição, e-mail (ainda não implementado)
```

Cada pasta de feature tem um `README.md` curto explicando seu escopo e de onde vêm os dados, ler antes de adicionar código lá.

---

## 5. Fases do MVP (do `product-plan.md`, seção 32)

### Fase 1: Fundação **(em andamento)**
- [x] Estrutura do projeto Next.js + TypeScript + pnpm
- [x] Schema Drizzle (auth, questões, provas, aprendizado, eventos, billing)
- [x] Better Auth configurado com RBAC (ADMIN/TEACHER/STUDENT)
- [x] Payload CMS configurado e funcional, `/admin/login` responde 200, todas as tabelas criadas
- [x] Site público (landing completa: hero, disciplinas, professores, planos, depoimentos, FAQ, CTA; blog placeholder)
- [x] Login / Cadastro (telas com Better Auth, testado ponta a ponta: cadastro → login → sessão com RBAC)
- [x] Área do aluno (layout autenticado + dashboard mostrando disciplinas reais do Payload)
- [x] Disciplinas → Módulos → Aulas (`/disciplinas`, `/disciplinas/[slug]`, `/aulas/[slug]`) consumindo o Payload via Local API
- [x] Player de vídeo (Vidstack) com resume/progresso, testado ponta a ponta: posição salva a cada ~10s e ao terminar, restaurada ao reabrir a aula
- [x] Progresso básico (`lesson_progress` via `POST /api/progress/lesson`, autenticado com Better Auth)
- [x] Conteúdo real de Biologia populado (ver `pnpm seed:biologia`)
- [x] Área do professor (`/professor`; conteúdo continua no `/admin` do Payload)
- [x] Área do administrador (`/gestao` com métricas e `/gestao/usuarios` com gerenciamento de contas)
- [x] Integração Mercado Pago (3 planos recorrentes criados via `pnpm seed:planos`, checkout, webhook com HMAC validado, portão de acesso em `/aulas/[slug]`)

### Fase 2: Aprendizado **(validada em runtime, 2026-09-16)**
- [x] Banco de questões sobre o acervo (`/questoes`): busca full-text, filtros por banca/ano/disciplina/tema e por situação (não respondidas, respondidas, erradas, favoritas), todos conferidos com `count()` direto no banco. Responder registra em `practice_answers`, corrige no servidor e só então revela — HTML/RSC da listagem provadamente não carregam gabarito; `/questoes/[id]` mostra texto-base e figuras (servidas por `/api/figuras/**`, 401 sem login, 403 sem assinatura, path traversal bloqueado).
- [x] Editor de questões com LaTeX (`/professor/questoes`, TipTap + `@aarkue/tiptap-math-extension`); testado publicando `$E=mc^2$` e a fórmula de Bhaskara, confirmado `data-latex` salvo e KaTeX renderizado no servidor (`src/lib/math-html.ts`) tanto no editor quanto em `/questoes/autorais`. Gabarito/explicação só chegam ao cliente via `revelarQuestaoAutoral` (HTML/RSC da listagem sem isCorrect/explanation).
- [x] Provas antigas + resolução/correção (`/provas`, `/provas/[documentId]`, folha de respostas, `/…/resultado`). Prova completa resolvida ponta a ponta (1 errada, 1 trocada, 1 em branco): nota, correção por questão e classificação por tema batem exatamente com o esperado; gabarito confirmado ausente do HTML/RSC durante a resolução.
- [x] Glossário (`/glossario`): contagem de termos bate com o Payload, busca bate com `ilike`, favoritar persiste.
- [x] Favoritos (`/favoritos`: questões, termos e aulas), favoritar/desfavoritar testado com reload em cada tipo.
- [x] Busca (`/busca`): Postgres full-text (`websearch_to_tsquery`) para questões e páginas das provas (com `ts_headline`), `like` do Payload para aulas/glossário — não é `.includes()` no cliente.
- [x] Fila de revisão do acervo (`/gestao/acervo`) com ações reais: aprovar, rejeitar, corrigir gabarito (propaga para cópias em conflito) e reabrir, cada uma gravando quem/quando/antes/depois em `library_reviews`.

### Fase 3: Organização **(validada em runtime, 2026-09-16)**
- [x] Plano de estudos (`/plano`): motor em `features/study-plan/engine.ts` coberto por 8 testes determinísticos (`node:test`) — rodízio, peso das disciplinas difíceis, revisão/simulado periódicos, dia da prova excluído. Testado também ao vivo: gera cronograma, concluir item persiste, refazer com novo ritmo preserva o item concluído e não repete a aula já dada.
- [x] Calendário (`/calendario`, react-big-calendar em pt-BR): confirmado que reúne plano + plantões + palestras + data da prova no mesmo calendário (não isolado), testado desktop e mobile.
- [x] Atividades / histórico (`/atividades`): confirmado que vem de `student_activities`/`practice_attempts` reais, não dados fictícios.
- [x] Dashboard de desempenho (`/desempenho`): aproveitamento geral, por disciplina e por tema conferidos batendo com `count()`/`filter` direto em `practice_answers`.

### Fase 4: Ao vivo **(validada em runtime, 2026-09-16)**
- [x] Plantões (`/professor/plantoes` para agendar/editar/excluir, `/plantoes` para o aluno). Janela do Meet (`features/live/janela.ts`, testada) confirmada como decisão do **servidor**: o link só chega ao HTML dentro de [início−15min, fim], testado movendo o horário no banco e recarregando — fora da janela o Meet não está no HTML, não é só escondido por CSS.
- [x] Palestras (mesmas telas), inclusive aparecendo no calendário do aluno quando têm `scheduledFor`.
- [x] Notificações por e-mail — disparo **manual** pelo botão "Avisar alunos", confirmado que só conta assinantes vigentes (aluno sem assinatura excluído da contagem) e não dispara sozinho ao criar o plantão.

**Bug real encontrado nesta rodada e corrigido em seguida**: ver "`timestamp` sem timezone lido com deslocamento de fuso" na seção 3 (Bloqueios conhecidos).

**Gap de UX da fila de revisão, também fechado depois**: `/gestao/acervo` só mostrava as outras versões de uma questão quando o item exibido era a **canônica**. A fila traz as duas pontas do conflito (a canônica e as cópias, todas marcadas com `conflito_duplicata`), e a busca era "quem aponta para este id" — que não devolve nada para uma cópia. Resultado: no caso em que o revisor mais precisa do contraste, ele decidia qual gabarito está certo sem ver o gabarito divergente. Agora o grupo é resolvido pela raiz (`duplicata_de ?? id`), a canônica vem marcada como tal, e o item exibido ganha um selo "cópia" quando é uma. Lógica de agrupamento em `features/library/duplicatas.ts` (pura, testada com `node:test`), fora do `queries.ts` que exige banco.

**Falha de autenticação nas actions do acervo, encontrada ao trocar leitura de código por teste de runtime**: o relatório da auditoria dava a matriz de segurança como correta, mas ressalvava que a parte de "chamar server action sem sessão" tinha sido verificada **lendo o código**, não exercitando o servidor. Ao exercitar, a ressalva se mostrou justificada.

Toda action exportada é um endpoint HTTP: o Next registra um id para cada uma em `server-reference-manifest.json`, o id vai para o bundle do cliente, e um anônimo faz `POST` com o header `Next-Action`. Em `features/library/actions.ts` a guarda de ADMIN morava dentro do helper `aplicar()`, e `aprovarQuestao`/`corrigirGabarito` consultavam o acervo *antes* de chegar nela. A escrita seguia barrada — mas, sem cookie nenhum:

- `aprovarQuestao` distinguia `questão não encontrada` de `defina o gabarito antes de aprovar`, e `corrigirGabarito` respondia `a questão não tem alternativa X` — um oráculo sobre o acervo pelo texto do erro;
- as duas faziam o servidor ir ao Postgres (4 `SELECT` medidos com `log_statement=all` para 6 chamadas anônimas);
- e as quatro actions do módulo respondiam `dados inválidos` quando o argumento não casava com o zod, porque a validação também vinha antes da guarda.

Ler o código não pegava isso: cada função parecia correta, `aplicar()` também. Errada era só a **ordem** entre elas, que só aparece seguindo a chamada. Corrigido tornando a guarda a primeira instrução de cada action exportada (`revisor()`), com `aplicar()` recebendo a sessão já conferida em vez de buscá-la. Depois da correção, as mesmas 6 chamadas anônimas resultam em redirect para `/login` e **zero** query no banco.

Duas verificações ficaram no repositório, porque uma sozinha não basta:

- `src/lib/auth/ordem-da-guarda.test.ts` — varredura estática (AST do TypeScript) de todo `features/*/actions.ts`, resolvendo as chamadas locais para achar qualquer leitura de banco anterior à guarda. Roda no CI, sem banco e sem build. Mesma ideia do guarda de fusos: pega a classe do bug, não a instância.
- `scripts/testes/actions-sem-sessao.mjs` — sonda HTTP real contra `pnpm start`, sem cookie, em todas as actions do manifest. Exige build e Postgres, então não roda no CI; é a confirmação de que a leitura do código corresponde ao comportamento. Verificado nos dois sentidos: acusa as actions no código com o bug e passa nas 25 depois da correção.

### Varredura de fronteiras de autorização (2026-09-17)

Aplicado o mesmo método — provar em runtime, não inferir do código — ao resto do projeto. Achados reais, todos corrigidos:

**1. REST do Payload entregava conteúdo pago a anônimo.** O `payload.config.ts` monta uma API REST em `/api/<slug>` pelo catch-all `src/app/(payload)/api/[...slug]/route.ts`, e quem decide o que sai por ali é `access.read` da collection — não a tela. `transcripts`, `captions`, `media`, `glossary-terms` e `staff` tinham `read: () => true`. Medido com `curl` sem cookie: `GET /api/transcripts` devolvia a transcrição inteira de uma aula paga (e, por profundidade, o e-mail do professor junto); `GET /api/glossary-terms` devolvia o glossário, que a tela `/glossario` cobra assinatura para mostrar; `GET /api/staff` listava as contas do painel (o Payload já esconde `hash`/`salt`, então não houve vazamento de credencial). `media` guarda só anexo pago — o `.vtt` das legendas e o arquivo de `lesson_materials` —, então `LessonMaterials` estava fechada enquanto o arquivo apontado por ela não estava.

Risco: todo o conteúdo pago em texto acessível sem pagar, mais o inventário de contas do painel. Correção: as cinco passaram a exigir `req.user`. Nenhuma tela quebra porque o app lê o Payload **só** pela Local API (`getPayloadClient()`), que roda com `overrideAccess: true` — conferido em runtime: `/glossario` continua renderizando o termo para o assinante enquanto a REST responde 403 ao anônimo. `subjects` e `modules` seguem públicas por serem catálogo (nome de disciplina e de módulo, sem conteúdo de aula), agora numa lista explícita no teste.

**2. Gabarito saía durante a prova em andamento.** `revelarGabarito` exigia assinatura, mas não olhava se a questão pertencia a uma prova que o próprio aluno tinha aberta — e `responderQuestao` era a segunda porta para o mesmo dado, porque devolve o gabarito junto com a correção (basta responder de propósito errado). Medido: com uma tentativa aberta, 3 de 3 gabaritos obtidos antes de responder, e a prova finalizada em seguida com 3/3. Não atravessa contas — o aluno só engana a si mesmo e ao próprio `/desempenho` —, mas derruba a premissa de que a nota mede alguma coisa. Correção: `emProvaAberta()` recusa nas duas portas enquanto a tentativa está aberta; finalizada, o banco livre volta a revelar normalmente.

O que foi verificado e estava **correto** (vale registrar para não re-auditar): IDOR nas tentativas de prova, plano de estudos e favoritos (toda query filtra por `studentId`); ownership de plantões (professor só edita o próprio, ADMIN edita qualquer um); `alterarPapel` (só ADMIN, sem auto-rebaixamento, nunca zera o último admin); escalação de papel no cadastro (`role` é `input: false` no Better Auth — tentativa com `"role":"ADMIN"` no corpo grava `STUDENT`); path traversal em `/api/figuras` e `/api/aulas` (regex ancorada antes de `path.join`); HMAC do webhook do Mercado Pago (fail-closed, janela de replay, comparação em tempo constante); Bearer das rotas `/v1/**` do GAPP (fail-closed, `timingSafeEqual`, 401 sem corpo descritivo); e a proteção de CSRF do Better Auth, que recusa sign-up sem `Origin` ou com origem diferente da `BETTER_AUTH_URL`.

Verificações novas no repositório:

- `src/payload/collections/acesso.test.ts` — roda no CI, sem banco e sem build. Não procura o texto `() => true`: **chama** cada `access.read` com um request sem usuário e recusa quem devolver `true` literal, o que continua valendo se a regra virar uma função e não rejeita o padrão legítimo de devolver um filtro (`Lessons` devolve `{ published: { equals: true } }`). Conferido nos dois sentidos.
- `scripts/testes/fronteiras-de-papel.mjs` — matriz em runtime (anônimo × aluno × dono do recurso): REST do Payload, escalação no cadastro, gabarito durante prova aberta, IDOR entre alunos. Cria e apaga os próprios dados, e recusa rodar se `DATABASE_URL` não for loopback. Exige build + Postgres, então não roda no CI. Conferido nos dois sentidos: acusa 9 falhas no código vulnerável, passa em tudo depois.

### Vitrine: preço, funil e navegação do site público (2026-09-17)

Uma auditoria de lançamento contra produção apontou que o produto por baixo estava mais maduro que a vitrine. Confirmei os achados no repositório e no site ao vivo antes de mexer; estes foram corrigidos:

**Preço anunciado diferente do cobrado.** A landing lia valores fixos em `features/marketing/content.ts` (R$ 97/79/67) enquanto o checkout cobra a tabela `plans` (R$ 99/267/474) — no semestral, R$ 72 de diferença. Conferido no site ao vivo: a home servia R$ 97. Além de matar a conversão depois da decisão de compra, o art. 30 do CDC vincula o fornecedor à oferta anunciada. A landing passou a ler `listarPlanosAtivos()`, e a formatação de preço saiu para `features/billing/precos.ts`, compartilhada com `/planos` — que tinha a mesma lógica duplicada, que foi justamente como os dois números divergiram. Preço agora muda num lugar só (o banco, via `pnpm seed:planos`). A landing é **dinâmica** com a consulta cacheada por 5 min (`unstable_cache`), e não estática com ISR: o Dockerfile compila de propósito sem acesso a banco (`DATABASE_URL=...@127.0.0.1:1/build`), então qualquer página gerada no build que consulte o Postgres quebra a compilação. Tentei ISR primeiro e o CI falhou com `Error occurred prerendering page "/"` — e o erro **só aparece no build do CI**, nunca em `pnpm build` local com banco no ar. Para reproduzir antes de empurrar, basta rodar o build com a `DATABASE_URL` do Dockerfile.

**"Sem renovação automática" contradizia a integração.** O FAQ prometia cobrança única para trimestral e semestral; `scripts/seed-planos.mjs` cria `preapproval_plan` com `auto_recurring` de 3 e 6 meses — renova. Prometer o contrário do que o sistema faz gera chargeback e reclamação. O texto passou a descrever o comportamento real. **Se a intenção do produto for cobrança única, o que muda é a integração, não o texto** — e aí este parágrafo fica errado.

**Funil perdia o plano escolhido.** Os CTAs mandavam `/cadastro?plano=X`, mas a página ignorava o parâmetro e o cadastro terminava no `/dashboard`. A pessoa decidia, pagava o custo de criar conta e caía num painel sem saber o que fazer. Agora o slug é validado contra `plans` (vem da URL, é entrada de usuário) e o cadastro leva a `/planos?plano=X`, que confirma a escolha e destaca o card certo.

**Navegação morta.** O cabeçalho do site público era `hidden md:flex` sem alternativa: abaixo de 768px não havia menu nenhum — e o `MobileNav` que existe em `features/auth` é da área logada, nunca cobriu a landing. As âncoras eram relativas (`#planos`), então fora da home viravam `/blog#planos` e não faziam nada. Agora há menu mobile (`features/marketing/components/site-nav.tsx`) e as âncoras são absolutas, com os links em `features/marketing/nav.ts`, um lugar só para cabeçalho e rodapé.

**Armadilha que isso revelou** (vale para o próximo): `navLinks` começou exportado do próprio `site-nav.tsx`, que é `"use client"`. Um server component importando um valor de um módulo client não recebe o valor — recebe a referência de cliente que o bundler põe no lugar. O build quebrou com `navLinks.map is not a function` ao pré-renderizar `/blog`, e **só no build**: em dev o módulo ainda é o original. Dado compartilhado entre servidor e cliente mora em módulo neutro.

**404 e acabamento.** Não havia `not-found.tsx` na raiz, então o Next servia a tela padrão em inglês, sem marca e sem caminho de volta, num site todo em português. Criado com a marca e rotas de saída. Mensagens de erro do Better Auth (que responde "Invalid email or password") passam por `features/auth/mensagens.ts`, mapeadas por `code` e não por texto. A seção "Quem ensina" usava `name.slice(0, 2)`, que em "Prof. João Ávila" dava "Pr" — agora descarta títulos e dá "JÁ"; `/perfil.jpg` foi removido do dado porque nunca existiu em `public/` (404 no console), e a grade acompanha quantos professores existem em vez de deixar metade vazia com um só.

**Aquisição e segurança de borda.** `robots.txt` e `sitemap.xml` respondiam 404; agora são gerados pelo Next (`app/robots.ts`, `app/sitemap.ts`), com as listas de rota pública e privada em `lib/site.ts` — mesmo lugar de onde sai o `metadataBase`, para canonical e sitemap não divergirem de domínio. O sitemap lista só o que um anônimo alcança: aula, questão e prova ficam de fora porque são conteúdo pago, e listá-las entregaria o catálogo. A home ganhou título com palavra-chave (era só "DespolarizaMED") e JSON-LD de `EducationalOrganization` e `FAQPage` — este último lendo a MESMA constante que a seção visível renderiza, para o schema nunca afirmar algo diferente da página. A área logada declara `robots: { index: false }` como segunda camada, porque `robots.txt` é pedido e não garantia. As telas de autenticação não tinham `<h1>` (usavam `CardTitle`, que é `div`). E a resposta não trazia nenhum header de segurança: agora vão HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy` pelo `next.config.ts` — na app, não só no proxy, porque a app é o que acompanha o código no deploy. CSP ficou de fora de propósito: exige inventariar cada origem e quebra a página sem aviso se mal ajustada; o caminho é `Content-Security-Policy-Report-Only` primeiro.

**Layout medido, não estimado.** A auditoria falava em "8px de overflow em 320px" e num selo do hero com contraste baixo. Medi com Chromium headless em 320/360/390/768/1440px, e os números eram outros — piores, e em parte por minha causa: ao adicionar o menu mobile eu tinha levado o overflow a **72px em 320px**, porque emblema + "Entrar" + "Criar conta" + botão do menu somam 392px fixos numa linha. Corrigido escondendo o nome escrito da marca e o "Entrar" abaixo de `sm` (o "Entrar" reaparece dentro do menu, o CTA principal fica), e compactando o botão. Resultado: 0px de excesso nas cinco larguras, nas cinco páginas públicas.

O selo do hero media **2.20:1** (texto `oklch(0.717 0.183 47.5)` = rgb(252,120,37) sobre o fundo composto rgb(245,230,223), medido pixel a pixel na tela), contra os 4.5:1 que AA exige em 14px — pior que os 2.7:1 estimados. Criado o token `--brand-orange-texto` (mesma matiz e croma, mais escuro): **5.28:1**. A cor da marca não mudou; mudou a que se usa para escrever com ela.

**Como reproduzir:** a medição usa Playwright apontando para o Chromium da máquina, e o script ficou fora do repositório porque Playwright não é dependência do projeto — adicioná-lo para virar job de CI é uma decisão de peso (baixa um navegador no pipeline) que vale tomar de propósito, não de passagem. O método: abrir cada página nas larguras alvo, comparar `documentElement.scrollWidth` com `clientWidth`, e para contraste ler o pixel do fundo composto em vez de confiar no valor declarado — `bg-cor/15` sobre gradiente não tem contraste calculável a partir do CSS.

**Imagem de compartilhamento.** O `public/og.png` era o emblema de 512px esticado para 1200×630 — borrado, sem headline e sem endereço; colado num grupo de WhatsApp não dizia o que é o produto. Substituído por `app/opengraph-image.tsx`, gerado com o `ImageResponse` do Next: acompanha o texto do site, não depende de designer nem de binário no repositório, e mudar a headline é mudar uma string. `app/twitter-image.tsx` reexporta a mesma arte, porque o X usa convenção separada e duas artes em arquivos diferentes divergem na primeira mudança. As imagens explícitas saíram do `metadata` do layout: declaradas ali, elas sobrepõem a convenção de arquivo, e era o que mantinha o og.png antigo no ar.

Dois defeitos só apareceram ao **olhar** a imagem renderizada: a faixa laranja do topo parava antes da borda direita (dentro de um pai com padding, `position: absolute` + `width: 100%` resolve contra a caixa de conteúdo — virou filho do flex), e o endereço do site em `#4884c0` media 2.97:1 sobre o fundo escuro, contra 6.46:1 do tom usado agora. Compilar não teria pego nenhum dos dois.

**Pendente, porque depende de dado que só a empresa tem**: Termos de Uso, Política de Privacidade e de Cancelamento (exigem razão social, CNPJ e canal de atendimento) e, com elas, o aceite no cadastro exigido pela LGPD; foto e formação real do professor; depoimentos com nome e autorização — hoje são anônimos e ficam em `content.ts` marcados como placeholder.

### CSP em Report-Only (2026-10-04)

A CSP que a Vitrine deixou de fora entrou em **modo relatório**
(`Content-Security-Policy-Report-Only`): o navegador não bloqueia nada, só avisa
`/api/csp-report`, que escreve uma linha JSON por violação no log do container
(`docker logs <container> | grep csp-violation`). Política, inventário de origens
e o que ainda é frouxo ficam em `src/lib/csp.ts`; `next.config.ts` só aplica.

- **Inventário:** tudo vem do próprio domínio. `next/font/google` baixa as fontes
  no build, as imagens são locais, e YouTube/Instagram/Meet/Mercado Pago aparecem
  só como link.
- **Ainda frouxo:** `script-src` e `style-src` com `'unsafe-inline'`. O Next
  injeta scripts inline de hidratação; o caminho é nonce por requisição via
  middleware, que torna toda página dinâmica — decisão à parte.
- **O endpoint trata o corpo como hostil:** limite de 16 KB aplicado *durante* a
  leitura do stream (sem `Content-Length`, `request.text()` bufferizaria tudo
  antes de checar — medido: 200 MB chunked respondem 204 sem a memória crescer);
  só diretiva + URL bloqueada + página, sem query string (token em URL não vai
  para o log) e sem a amostra de script.
- **Volume de log limitado entre requisições** (`FiltroDeRelatorios`): por
  minuto, no máximo 30 linhas `csp-violation` (uma por violação distinta) e uma
  linha `csp-violation-resumo` com as repetições mais frequentes e quantos
  relatórios chegaram depois do orçamento acabar (`relatorios_descartados`:
  ocorrências, não violações distintas — contar distintas exigiria memória sem
  teto) — teto rígido de 31 linhas/min, testado sob o
  cenário de ataque. Um timer fecha o minuto sem depender de tráfego, e campos
  que não são string viram vazio (um objeto com `toString: null` derrubaria a
  coerção e viraria 500 fora do orçamento).

**Armadilha medida, para ninguém "modernizar" sem querer:** com `report-uri` e
`report-to` juntos, o Chromium usa só o `report-to` e ignora o outro — e o
`report-to` entrega em lote, com atraso (em 65 s de teste não chegou nada). Por
isso a política tem só `report-uri`, e um teste falha se `report-to` voltar.
`upgrade-insecure-requests` também saiu: em Report-Only ela é ignorada e gera um
aviso no console de todo visitante.

**Validado** com a imagem montada do build do Dockerfile e Chromium headless:
páginas públicas, `/admin/login`, 404 e a área logada (cadastro real) sem
nenhuma violação; uma violação forçada (imagem externa injetada) chega ao log na
hora, já sem a query string.

**Próximo passo:** deixar rodar em produção, ler o log, e quando estiver limpo
trocar `HEADER_CSP` para `Content-Security-Policy` (o teste que trava o nome
existe para essa troca ser deliberada).

### Fase 5: Inteligência educacional (pós-MVP)
- [ ] Pipeline de vídeo completo (FFmpeg worker + BullMQ: transcodificação/HLS/thumbnail)
- [ ] Transcrição automática (faster-whisper) + legendas `.vtt`
- [ ] Busca semântica, resumos, recomendações (fora de escopo do MVP)

---

## 6. Motores que precisam de lógica própria (não existe open-source pronto)

Estes são o diferencial competitivo do produto, não procurar biblioteca pronta, é trabalho de domínio:

1. **Motor de plano de estudos**, regras simples no MVP (dias/semana × horas/dia × data da prova → cronograma), nada de ML nesta fase.
2. **Motor de correção de provas/simulados**, cálculo de acerto, identificação de pontos fracos por tema/subtema.
3. **Metadados e filtros do banco de questões**, já modelado em `src/lib/db/schema/questions.ts`.
4. **Pipeline de vídeo**, FFmpeg + BullMQ, worker Node dedicado (Fase 5).

---

## 7. Ambiente local

- Postgres: `localhost:5432`, banco `despolarizamed`, user/pass `postgres`/`postgres` (ver `.env.local`). Padrão: container Docker `avilaops-postgres` (postgres:18-alpine, porta 5432) — precisa do Docker Desktop de pé; `docker start avilaops-postgres`. Em 2026-09-16, com o Docker Desktop instável na máquina de dev, a validação desta auditoria rodou contra um Postgres 18 via `embedded-postgres` num diretório temporário (mesma porta/credenciais) — não é infraestrutura permanente, só uma alternativa pontual quando o container não sobe.
- Figuras do acervo: `DATA_DIR` (padrão `./data`) é a raiz de `figures/**`; `data/` está no `.gitignore`.
- Migration pendente de aplicar em produção: `src/lib/db/migrations/0006_huge_quentin_quire.sql` (tabelas `practice_*`). Rodar `pnpm db:migrate` antes do próximo deploy.
- Variáveis de ambiente: `.env.example` tem a lista completa sem valores. `.env.local`/`.env.production` têm os valores reais e **nunca devem ser commitados** (já no `.gitignore`).
- Scripts (`package.json`):
  - `pnpm dev` / `pnpm build` / `pnpm start` - Next.js
  - `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` / `pnpm db:studio` - Drizzle (schema transacional)
  - `pnpm payload:migrate:create` / `pnpm payload:migrate` - migrations do Payload (schema de conteúdo); ver seção 3 "Bloqueios" para o porquê de não usar `pnpm payload migrate:create` direto
  - `pnpm seed:biologia <staff-email> <staff-password>` - popula a disciplina Biologia (2 módulos, 10 aulas) via API REST do Payload; idempotente, serve de molde para Física/Química
- **`pnpm build` precisa de um Postgres alcançável.** O Payload conecta durante
  o build (coleta de rotas e prerender) e, sem banco, o processo morre em
  "Collecting build traces" sem gerar `.next/standalone` — o erro real
  (`ECONNREFUSED 127.0.0.1:5432`) aparece dezenas de linhas antes, então é fácil
  culpar a fase errada. Se o Postgres local estiver parado, aponte o build para
  o de produção por um túnel:

  ```bash
  ssh -f -N -L 15432:127.0.0.1:5432 applications
  DATABASE_URL="postgres://despolarizamed:<senha>@127.0.0.1:15432/despolarizamed"     PAYLOAD_DISABLE_PUSH=true pnpm build
  ```

  `PAYLOAD_DISABLE_PUSH=true` é obrigatório aí: sem ele o Payload tentaria
  sincronizar o schema do banco de produção a partir do código local.
- **Não use `MSYS_NO_PATHCONV=1` ao chamar `pnpm` no Git Bash.** Ele corrompe o
  caminho do corepack (`Cannot find module 'D:\c\Program Files
odejs\...'`).
  A variável só é necessária para `curl`/`ssh` com argumentos que começam com
  `/`; nunca para o build.
- **`pnpm dev` e `pnpm build` não podem rodar ao mesmo tempo**, ambos escrevem no mesmo diretório `.next` e um build rodando com o dev server ativo falha com `TypeError: Cannot read properties of undefined (reading 'call')` no webpack-runtime. Sempre parar o `pnpm dev` (ou rodar `rm -rf .next`) antes de um `pnpm build` de verificação.
- **Encoding UTF-8 ao chamar a API do Payload via `curl` no Windows/Git Bash**: strings inline (`-d '{"name":"Bioquímica"}'`) corrompem acentos. Sempre escrever o payload em um arquivo `.json` (UTF-8) e usar `--data-binary "@arquivo.json"`, ou usar `fetch` do Node (como em `scripts/seed-biologia.mjs`) em vez de `curl` inline.

---

## 8. Produção

A app está no ar no host `applications` (Hetzner), porta **3100** (3080 já é do
lojas-avilaops), atrás do Caddy. Deploy com `bash scripts/deploy.sh <versao>`:
build local, tgz, `docker build` no servidor. O build **não** roda no servidor,
o CX23 não tem folga de RAM para compilar Next sem derrubar os vizinhos.

- Segredos: `/etc/gapp/despolarizamed/secrets.env` (root:root 0600), fora do repo.
- Banco: Postgres 18 nativo, role e database `despolarizamed`, alcançado pela
  bridge Docker (`172.17.0.1`), já coberto pelo `pg_hba`.
- Harness GAPP: `/v1/*`, com `/v1/stats` e `/v1/ops/*` respondendo 404 pela
  internet (só a rede interna lê). Ver `docs/padrao-gapp.md`.
- **O domínio resolve e a plataforma está pública** (conferido em 2026-09-17):
  os NS foram trocados no Registro.br e hoje são `donald.ns.cloudflare.com` /
  `dora.ns.cloudflare.com`, a zona da Ávila Ops. `despolarizamed.com.br`
  aponta para `178.105.82.48` (registro A direto, sem proxy do Cloudflare),
  responde 200 com TLS válido e `/v1/health` reporta `db: ok`. **Consequência
  prática: não existe mais janela de "ninguém vê se quebrar".**

### Migrations no deploy

**O container aplica as próprias migrations antes de servir.** Isso não existia
até 2026-09-17, e a ausência era perigosa: um `push` na `main` dispara deploy
automático (`DEPLOY_ENABLED` está ligado), e nada no caminho rodava migration —
nem o `scripts/deploy.sh`, nem o workflow de `avilaops/infra`, nem a imagem,
cujo `CMD` ia direto para `node server.js`. Código novo subia contra o schema
velho, e os dois sinais que deveriam acusar isso não acusavam: `/v1/ready` só
fazia `select 1`, e `/v1/ops/status` trazia `migrations_pending: 0` como
**literal**, conformidade declarada em vez de medida.

Como funciona agora:

- `docker-entrypoint.sh` roda `scripts/migrar.mjs` e só então `node server.js`.
  O `set -e` é o ponto do arquivo: migration que falha derruba o container, e o
  deploy falha de forma visível. Container que não sobe é um problema óbvio;
  container que sobe com o schema errado responde 200 e engana o healthcheck.
- `scripts/migrar.mjs` usa o migrator do `drizzle-orm` (dependência de runtime),
  não o `drizzle-kit` (devDependency, que traria o pacote inteiro ao runtime).
  É o mesmo código que `pnpm db:migrate` executa por baixo.
- `MIGRAR=0` pula o passo, para subir a app sem tocar no banco durante um
  incidente. Não vira contorno silencioso: `/v1/ready` continua reprovando
  enquanto houver drift.
- `/v1/ops/status` passou a **medir**: `migrations_pending` é contagem real,
  `migrations_pending_tags` nomeia quais, e `null` significa "não sei" (banco
  fora do ar), que é diferente de `0`.
- `/v1/ready` responde **503 `migrations_pending`** quando o banco está atrás da
  imagem, então um container nessas condições não recebe tráfego.

**Armadilha que custou duas tentativas, para ninguém repetir:** o `migrar.mjs`
roda fora do bundle do Next e precisa resolver `postgres` e `drizzle-orm` como
pacotes de verdade. O `.next/standalone` não serve para isso — o Next **embute**
o driver no chunk do servidor em vez de deixá-lo em `node_modules` (o topo do
standalone só tem `graphql`, `next`, `react`, `typescript`). E
`outputFileTracingIncludes` apontando para um arquivo só materializa o `.js`
**sem o `package.json`**, que não carrega. Por isso o Dockerfile copia os dois
pacotes inteiros do build stage: nenhum dos dois tem dependência de runtime,
então é autocontido e travado na versão do lockfile.

**Migrations do Payload (desde 2026-10-03).** O `migrar.mjs` cuida só do
Drizzle; a cadeia do Payload (`src/migrations/`) roda em outro ponto do start,
porque o Payload não carrega fora do bundle do Next (é o mesmo problema do CLI,
seção 3) e o `.next/standalone` nem tem `src/migrations/`:

- `payload.config.ts` passa o array de `src/migrations/index.ts` em
  `prodMigrations`. Com `NODE_ENV=production`, o adapter aplica o que falta ao
  conectar — caminho oficial do Payload, regra por **nome** em
  `payload_migrations` (o Drizzle decide por tempo).
- `src/instrumentation.ts` conecta o Payload no `register()`, que o Next espera
  antes de atender qualquer requisição (`handleRequest` aguarda `prepare()`).
  Sem isso a conexão — e a migration — ficaria para o primeiro aluno que abrisse
  uma aula. Fica de fora do `next build`, de `next dev` e do runtime edge.
- Antes de entregar o banco ao adapter, uma sonda (`bloqueioDoPayload`, em
  `src/lib/db/migracoes-payload.ts`) recusa dois estados em que o `migrate` do
  Payload faria mal sem TTY: registro de push de dev (`batch = -1`), em que ele
  pergunta interativamente se pode prosseguir com perda de dados; e tabelas já
  existentes sem a `init` registrada, em que ele tentaria recriá-las. Nos dois o
  processo sai com 1 e a mensagem traz o SQL do remédio.
- Falha derruba o processo, como no lado Drizzle. `MIGRAR=0` desliga as duas
  cadeias.
- `/v1/ready` e `/v1/ops/status` medem as duas cadeias. Pendência do Payload
  aparece com prefixo (`payload/20260811_105519_init`); `migrations_pending` é a
  soma, e vira `null` se qualquer cadeia não puder ser medida.

Validado contra Postgres real com uma cópia da imagem montada do
`.next/standalone` compilado como no Dockerfile: banco virgem (as duas cadeias
aplicadas, `/v1/ready` 200), tabelas sem registro (sai 1 com o `insert`),
registro de dev (sai 1 com o `delete`), e `MIGRAR=0` (sobe, nada migra,
`/v1/ready` 503 nomeando `payload/20260811_105519_init`).

**Antes do primeiro deploy com isso**, conferir em produção que
`select name, batch from payload_migrations` traz `20260811_105519_init` com
`batch = 1` e nenhuma linha `-1`. Se não trouxer, a sonda impede o container de
subir — o certo, mas melhor descobrir antes do que no deploy.

**Concorrência:** hoje o `runtime.services` do manifesto declara um único
serviço `web`, então não há duas réplicas migrando ao mesmo tempo. Se algum dia
houver, este passo precisa de lock antes de escalar.

### Mercado Pago

Conta `nicolas@avila.inc` (a da Ávila Ops, não a do cliente): quando o
DespolarizaMED tiver conta própria, trocar `MP_ACCESS_TOKEN` e rodar
`pnpm seed:planos` de novo para recriar os planos lá.

O webhook precisa ser cadastrado no painel do Mercado Pago apontando para
`https://despolarizamed.com.br/api/webhooks/mercadopago`, o que só faz sentido
depois que o domínio resolver.

## 9. Convenções: ver `docs/conventions.md`

Padrões de código, nomenclatura e como decidir "isso é feature do Drizzle ou do Payload" estão detalhados separadamente para não inflar este arquivo.
