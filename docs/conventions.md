# Convenções de código — DespolarizaMED

Leia isto depois do `docs/roadmap.md`. São regras práticas para manter o código consistente entre humanos e agentes trabalhando neste repositório.

## Decisão mais importante: Payload vs Drizzle

Antes de criar qualquer tabela nova, pergunte: **"isso é conteúdo editorial que um professor/admin precisa cadastrar por uma tela, ou é dado transacional gerado pelo sistema/aluno?"**

- Conteúdo editorial (professor cadastra aula, glossário, material) → **Payload CMS**, nova collection em `src/payload/collections/`, registrada em `src/payload/payload.config.ts`.
- Dado transacional (progresso, tentativa de prova, assinatura, evento de pagamento) → **Drizzle**, novo arquivo/tabela em `src/lib/db/schema/`.

Nunca modele a mesma entidade nos dois lados. Ver `docs/roadmap.md` seção 2 para a lista atual de quem é dono do quê.

Ao referenciar uma collection do Payload a partir de uma tabela Drizzle, use `integer` (não `uuid`) sem `.references()` — Payload usa IDs seriais e Drizzle não pode ter FK real para uma tabela que não gerencia. Comente a coluna explicando a que collection ela se refere (ver `src/lib/db/schema/questions.ts` como exemplo).

## Schema Drizzle

- Um arquivo por domínio em `src/lib/db/schema/` (`auth.ts`, `questions.ts`, `exams.ts`, `learning.ts`, `events.ts`, `billing.ts`). Não criar um único arquivo gigante nem um arquivo por tabela.
- Todo novo arquivo de schema precisa ser reexportado em `src/lib/db/schema/index.ts` (`export * from "./nome"`).
- IDs: `uuid("id").primaryKey().defaultRandom()` para tabelas Drizzle. Exceção: `users`/`sessions`/`accounts`/`verifications` usam `text("id")` porque são gerenciadas pelo Better Auth (que gera seus próprios IDs).
- Depois de mudar o schema: `pnpm db:generate` (gera SQL em `src/lib/db/migrations`) e `pnpm db:migrate` (aplica no Postgres local). Nunca editar um arquivo de migration já gerado — gerar um novo.
- Enums usam `pgEnum` com valores em `MAIUSCULO_SNAKE_CASE` (ex: `"ADMIN" | "TEACHER" | "STUDENT"`, `"PENDING" | "ACTIVE"`) — já é o padrão usado em todo o schema, manter consistência.

## Payload CMS

- Uma collection por arquivo em `src/payload/collections/`, nome do arquivo em PascalCase igual ao nome exportado (`Subjects.ts` exporta `Subjects`).
- `slug` da collection em kebab-case no plural (`lesson-materials`, não `LessonMaterials` nem `lesson_material`).
- Toda collection precisa de `access` explícito (`read`/`create`/`update`/`delete`) — não deixar no default do Payload (que é liberado para autenticados). Seguir o padrão já usado: leitura pública quando fizer sentido (conteúdo publicado), escrita restrita a `req.user` autenticado, delete restrito a `role === "ADMIN"`.
- Login do painel `/admin` é feito pela collection `Staff` (Payload nativo), **não** pelo Better Auth. Isso é intencional — ver `docs/roadmap.md` seção 1.

## Auth / RBAC

- Sessão do aluno/professor/admin (lado do produto, não do `/admin` do Payload): Better Auth, configurado em `src/lib/auth/index.ts`.
- Checagem de permissão: usar `hasRole`/`requireRole` de `src/lib/auth/rbac.ts`, nunca comparar strings de role manualmente espalhado pelo código.
- Hierarquia de papéis é cumulativa: `ADMIN > TEACHER > STUDENT` (`hasRole("ADMIN", "STUDENT")` é `true`). Se um novo papel for adicionado (`CONTENT_MANAGER`, `SUPPORT`, etc. — ver `product-plan.md` seção 19), decidir explicitamente onde ele entra na hierarquia ou se RBAC hierárquico simples deixa de ser suficiente (nesse caso, migrar para permissões granulares por ação, não continuar empilhando na hierarquia).

## Estrutura de features (`src/features/*`)

- Cada pasta é um domínio de produto, não uma camada técnica (não criar `src/features/components` ou `src/features/hooks` genéricos).
- Cada pasta tem um `README.md` curto (2-4 linhas) dizendo o escopo e de onde vêm os dados. Ler o README da feature antes de adicionar código nela; atualizar o README se o escopo mudar.
- Código client-side (componentes, hooks) fica na feature. Lógica de servidor que pertence claramente a um domínio também pode ficar lá (ex: `features/billing/webhook-handler.ts`); lógica compartilhada entre features vai em `src/lib/`.

## Estilo geral

- TypeScript estrito (`strict: true` já configurado) — não usar `any` sem justificar com comentário.
- Sem comentários explicando o óbvio. Comentar apenas o não-óbvio: por que uma decisão foi tomada, um workaround, uma limitação de dependência externa (ver exemplos em `src/payload/payload.config.ts` e nos arquivos de schema que referenciam collections do Payload).
- Nomes de arquivo de componente React: PascalCase. Nomes de arquivo utilitário/lib: kebab-case ou camelCase conforme o resto do arquivo (não há um padrão rígido ainda pois pouco código de UI existe — ao criar o primeiro conjunto de componentes de verdade, manter consistência com o que já existir).

## Antes de declarar algo "funcionando"

Se você (agente ou dev) alterar dependências, configuração de build, ou versões de pacotes: rodar `pnpm build` com `.next` limpo (`rm -rf .next && pnpm build`) e conferir o output real antes de reportar sucesso. O histórico deste projeto já teve mais de uma vez onde um bug parecia resolvido mas só tinha mudado de forma — ver `docs/roadmap.md` seção 3 para o caso real.
