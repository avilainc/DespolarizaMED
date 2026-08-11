# Convenções — DespolarizaMED

Padrões de código e regras práticas para manter consistência entre features e entre agentes/devs diferentes. Ler junto com [`docs/roadmap.md`](./roadmap.md) (que tem o "porquê" das decisões de stack) e [`docs/product-plan.md`](./product-plan.md) (visão de produto).

---

## 1. "Isso é Drizzle ou Payload?"

Regra rápida antes de criar qualquer tabela/collection nova:

- **É conteúdo que um professor/admin edita pelo painel visual, sem tocar em código?** → Payload (`src/payload/collections/`).
- **É dado gerado pelo sistema, transacional, ou específico de um aluno (progresso, tentativa de prova, assinatura)?** → Drizzle (`src/lib/db/schema/`).

Nunca crie a mesma entidade nos dois lados. Ver `docs/roadmap.md` seção 2 para a lista atual de quem é dono do quê.

Ao referenciar uma entidade do Payload a partir de uma tabela Drizzle, use `integer` sem foreign key do Drizzle (Payload usa serial/integer, e Drizzle não pode ter FK para uma tabela que não gerencia):

```ts
// subjectId references Payload's "subjects" collection (owned by Payload, not a Drizzle FK).
subjectId: integer("subject_id").notNull(),
```

---

## 2. Mudando o schema do Payload (collections)

**Nunca** dependa do push automático de dev — está desligado de propósito (`PAYLOAD_DISABLE_PUSH=true` em `.env.local`/`.env.example`) porque exige TTY interativo e quebra em shells não-interativos. Ver `docs/roadmap.md` seção 3 para o diagnóstico completo.

Fluxo correto sempre que uma collection mudar (novo campo, nova collection, campo removido):

```bash
pnpm payload:migrate:create nome-descritivo-da-mudanca
pnpm payload:migrate
```

Isso gera um arquivo em `src/migrations/` (SQL real, revisável) e aplica no Postgres. Commitar o arquivo gerado junto com a mudança na collection.

Se `pnpm payload:migrate` perguntar sobre "dev mode... data loss" (aparece quando alguém rodou `pnpm dev` sem `PAYLOAD_DISABLE_PUSH`, e o Payload fez um push automático), responda considerando se há dados reais no banco que não podem ser perdidos. Em dev local isso normalmente é seguro de aceitar.

---

## 3. Mudando o schema do Drizzle (tabelas transacionais)

```bash
pnpm db:generate   # gera migration a partir do diff em src/lib/db/schema/*.ts
pnpm db:migrate    # aplica no Postgres
```

Sem bloqueios conhecidos aqui — `drizzle-kit generate`/`migrate` funcionam normalmente em qualquer shell.

---

## 4. Nomenclatura

- **Arquivos de schema Drizzle**: um arquivo por domínio (`auth.ts`, `questions.ts`, `exams.ts`, `learning.ts`, `events.ts`, `billing.ts`), reexportados via `src/lib/db/schema/index.ts`. Não criar um arquivo por tabela individual.
- **Tabelas Drizzle**: `snake_case` no banco (via `pgTable("nome_tabela", ...)`), `camelCase` no código TS.
- **Collections Payload**: `slug` em `kebab-case` (ex: `lesson-materials`), nome do arquivo/export em `PascalCase` (ex: `LessonMaterials.ts`).
- **Enums**: `SCREAMING_SNAKE_CASE` para os valores (ex: `ADMIN`, `TEACHER`, `STUDENT`, `MULTIPLA_ESCOLHA`) — já é o padrão usado no `product-plan.md` original, mantido por consistência com a documentação de produto.

---

## 5. Onde colocar código novo

- **UI/lógica client-side de uma feature de produto** → `src/features/<nome>/`. Cada pasta já tem um `README.md` curto explicando escopo e fonte de dados — ler antes de adicionar código.
- **Lógica de servidor compartilhada entre features** (ex: cálculo de progresso, motor de correção de prova) → `src/lib/` ou um novo módulo dedicado, não dentro de `features/`.
- **Workers/processadores em background** (vídeo, transcrição, e-mail) → `src/server/jobs/`.
- **Config de filas BullMQ/Redis** → `src/server/queue/`.
- **Scripts de infraestrutura/dev tooling** (como os de migration do Payload) → `scripts/`, documentados no roadmap se resolverem algum bloqueio não óbvio.

---

## 6. Segredos e ambiente

- `.env.local` e `.env.production` **nunca** são commitados (já no `.gitignore`) — contêm valores reais.
- `.env.example` é a fonte de verdade de quais variáveis existem, sempre sem valores. Ao adicionar uma variável de ambiente nova, adicionar em ambos os arquivos.
- Nunca commitar CPF, tokens, ou qualquer credencial real em qualquer arquivo versionado, mesmo que pareça "só de exemplo".

---

## 7. Antes de abrir mão de uma decisão já tomada

Se algo neste documento ou no roadmap parecer errado ou limitante, é permitido reconsiderar — mas documentar o motivo da mudança no roadmap (seção "Rejeitado conscientemente" ou nova entrada de bloqueio), não simplesmente silenciosamente fazer diferente. O objetivo é que o próximo agente/dev entenda o histórico de decisão, não precise re-descobrir os mesmos bugs (como o do Payload+TTY, que levou horas de investigação).
