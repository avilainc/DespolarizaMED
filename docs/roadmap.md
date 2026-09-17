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

### [ABERTO 2026-09-16] `timestamp` sem timezone lido com deslocamento de fuso

Reproduzido ao validar `live_sessions` em runtime: um plantão criado às 01:07 (hora local, UTC-3) é escrito corretamente no Postgres (`timestamp without time zone`, literal `2026-09-17 01:07:00` quando o instante UTC real é `04:07:00Z`), mas ao ser **lido de volta** pelo driver `postgres.js`, o valor retorna deslocado em +3h adicionais (`07:07:00Z` em vez de `04:07:00Z`). Causa raiz confirmada por teste isolado (grava um instante conhecido via SQL cru, lê de volta com `select ... ::text` e comparando com o `Date` que o driver constrói): o `postgres.js`, ao converter o literal `timestamp` (sem fuso) de volta para `Date`, usa um parsing de string não-ISO ("YYYY-MM-DD HH:mm:ss", sem "T") que o V8 interpreta como **hora local do processo Node**, ignorando a sessão Postgres (que está com `TimeZone=GMT`). Em uma máquina com fuso UTC-3, isso soma +3h no sentido errado sobre um valor que já tinha sido escrito corretamente.

**Por que ainda não quebrou em produção**: a imagem roda em `node:24-slim`, cujo fuso padrão é UTC — nesse caso a "hora local do processo" coincide com UTC e o bug fica invisível. Ele se manifesta em qualquer ambiente onde o processo Node não roda em UTC: todo `pnpm dev`/`pnpm start` local no Brasil (confirmado), e produção também quebraria se algum dia o `TZ` do container for setado para `America/Sao_Paulo` (mudança plausível, já que é comum querem log em hora local).

**Escopo**: toda coluna `timestamp(...)` sem `{ withTimezone: true }` no schema Drizzle é suscetível quando lida via `postgres.js` — não só `live_sessions`, mas potencialmente `study_plan_items.scheduled_for`, `practice_attempts.started_at/finished_at`, `sessions.expiresAt`, etc. Só ficou comprovado por teste isolado em `live_sessions`; as outras tabelas têm o mesmo padrão de coluna e o mesmo driver, mas não foram testadas uma a uma.

**Fix recomendado, não aplicado nesta auditoria** (mudança de schema, merece PR própria): migrar as colunas que representam um instante absoluto (não um "dia calendário") para `timestamp with time zone` (`timestamptz`), que remove a ambiguidade — Postgres sempre normaliza para UTC internamente e a conversão de volta para `Date` do driver não depende do fuso do processo que está lendo.

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

**Bug real encontrado e não corrigido nesta rodada**: ver "`timestamp` sem timezone lido com deslocamento de fuso" na seção 3 (Bloqueios conhecidos).

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

**Limite conhecido:** o `migrar.mjs` cuida só do Drizzle. O Payload tem cadeia
própria (`src/migrations/`) e hoje não há migration de Payload pendente além da
`init`, já aplicada. Quando houver, ela precisa entrar aqui também — e o
`/v1/ready` não a enxerga.

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
