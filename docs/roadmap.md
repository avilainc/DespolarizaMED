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

### Fase 2: Aprendizado **(concluída em código, 2026-09-16; aguardando validação em runtime)**
- [x] Banco de questões sobre o acervo (`/questoes`): busca full-text, filtros por banca/ano/disciplina/tema e por situação (não respondidas, respondidas, erradas, favoritas). Responder registra em `practice_answers` e revela o gabarito; `/questoes/[id]` mostra texto-base e figuras (servidas por `/api/figuras/**`, protegidas por assinatura).
- [x] Editor de questões com LaTeX (`/professor/questoes`, TipTap + `@aarkue/tiptap-math-extension`); o aluno vê em `/questoes/autorais`, com KaTeX renderizado no servidor (`src/lib/math-html.ts`).
- [x] Provas antigas + resolução/correção (`/provas`, `/provas/[documentId]`, folha de respostas, `/…/resultado` com pontos fortes e "revisar" por tema). Motor de correção em `practice/actions.ts` + página de resultado.
- [x] Glossário (`/glossario`, collection do Payload, agrupado por inicial, com favoritos).
- [x] Favoritos (`/favoritos`: questões, termos e aulas; estrela nos cards).
- [x] Busca (`/busca`: aulas, questões, glossário e páginas das provas, Postgres FTS).
- [x] Fila de revisão do acervo para o admin (`/gestao/acervo`) — só leitura; falta ação de aprovar/corrigir gabarito.

### Fase 3: Organização **(concluída em código, 2026-09-16)**
- [x] Plano de estudos (`/plano`): motor determinístico em `features/study-plan/engine.ts` (dias/semana × horas/dia × data da prova → aulas em rodízio por disciplina, exercícios, revisão a cada 7º dia, simulado a cada 14º; disciplinas difíceis com peso 2). Refazer preserva itens concluídos.
- [x] Calendário (`/calendario`, react-big-calendar em pt-BR): plano, plantões, palestras e data da prova.
- [x] Atividades / histórico (`/atividades`).
- [x] Dashboard de desempenho (`/desempenho`): aproveitamento geral, por disciplina, por tema, últimos 30 dias. Barras em CSS, sem lib de gráfico.

### Fase 4: Ao vivo **(concluída em código, 2026-09-16)**
- [x] Plantões (`/professor/plantoes` para agendar, `/plantoes` para o aluno; botão do Meet aparece 15 min antes; gravação depois).
- [x] Palestras (mesmas telas).
- [x] Notificações por e-mail (`mail.avilaops.com`) — disparo **manual** pelo botão "Avisar alunos" para todos os assinantes vigentes. n8n não está ligado a isso ainda.

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

- Postgres: `localhost:5432`, banco `despolarizamed`, user/pass `postgres`/`postgres` (ver `.env.local`). Roda no container Docker `avilaops-postgres` (postgres:18-alpine, porta 5432) — precisa do Docker Desktop de pé; `docker start avilaops-postgres`.
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
- **O domínio `despolarizamed.com.br` ainda não resolve**: é registrado em nome
  de terceiro no Registro.br e os NS apontam para `a.auto.dns.br`. A zona já
  existe no Cloudflare da Ávila Ops (`donald.ns.cloudflare.com`,
  `dora.ns.cloudflare.com`) com os registros prontos, mas o certificado só sai
  quando os nameservers forem trocados no Registro.br.

### Mercado Pago

Conta `nicolas@avila.inc` (a da Ávila Ops, não a do cliente): quando o
DespolarizaMED tiver conta própria, trocar `MP_ACCESS_TOKEN` e rodar
`pnpm seed:planos` de novo para recriar os planos lá.

O webhook precisa ser cadastrado no painel do Mercado Pago apontando para
`https://despolarizamed.com.br/api/webhooks/mercadopago`, o que só faz sentido
depois que o domínio resolver.

## 9. Convenções: ver `docs/conventions.md`

Padrões de código, nomenclatura e como decidir "isso é feature do Drizzle ou do Payload" estão detalhados separadamente para não inflar este arquivo.
