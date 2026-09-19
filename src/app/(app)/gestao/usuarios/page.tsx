import type { Metadata } from "next";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { listUsers } from "@/features/admin/users";
import { RoleSelect } from "@/features/admin/components/role-select";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { InitialsAvatar, Tag } from "@/components/ui/chip";
import { Field, SelectField, TextField } from "@/components/ui/field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { UserRole } from "@/lib/auth/rbac";

export const metadata: Metadata = { title: "Usuários — DespolarizaMED" };

const PAPEIS: { valor: UserRole | ""; rotulo: string }[] = [
  { valor: "", rotulo: "Todos" },
  { valor: "ADMIN", rotulo: "Administradores" },
  { valor: "TEACHER", rotulo: "Professores" },
  { valor: "STUDENT", rotulo: "Alunos" },
];

function formatarData(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; papel?: string }>;
}) {
  const { session } = await requireSessionWithRole("ADMIN");
  const { busca, papel } = await searchParams;

  const papelFiltro = PAPEIS.some((p) => p.valor === papel && p.valor !== "")
    ? (papel as UserRole)
    : undefined;

  const usuarios = await listUsers({ busca, papel: papelFiltro });

  return (
    <>
      <PageHeader
        migalhas={[{ rotulo: "Administração", href: "/gestao" }, { rotulo: "Usuários" }]}
        titulo="Usuários"
        descricao={`${usuarios.length} ${usuarios.length === 1 ? "conta encontrada" : "contas encontradas"} neste filtro. O papel define o que cada pessoa enxerga na plataforma.`}
      />

      {/* Busca por GET: o filtro fica na URL, então dá para compartilhar e
          voltar para ele pelo histórico do navegador. */}
      <form role="search" className="mb-7 grid gap-3 sm:grid-cols-[minmax(0,22rem)_14rem_auto]">
        <Field rotulo="Buscar por nome ou e-mail">
          {({ id }) => (
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              />
              <TextField
                id={id}
                name="busca"
                type="search"
                defaultValue={busca ?? ""}
                placeholder="Nome ou e-mail"
                className="pl-9"
              />
            </div>
          )}
        </Field>

        <Field rotulo="Papel">
          {({ id }) => (
            <SelectField id={id} name="papel" defaultValue={papel ?? ""}>
              {PAPEIS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.rotulo}
                </option>
              ))}
            </SelectField>
          )}
        </Field>

        <div className="flex items-end">
          <Button type="submit" size="lg">
            Filtrar
          </Button>
        </div>
      </form>

      <DataTable
        chave={(u) => u.id}
        linhas={usuarios}
        vazio={
          <EmptyState
            ilustracao="/illustrations/vazio-busca.svg"
            titulo="Nenhuma conta encontrada"
            descricao="Nenhum usuário corresponde a esse nome, e-mail ou papel."
            acao={
              busca || papel ? (
                <a href="/gestao/usuarios" className={buttonVariants({ variant: "brand" })}>
                  Limpar filtros
                </a>
              ) : undefined
            }
          />
        }
        colunas={[
          {
            chave: "nome",
            cabecalho: "Usuário",
            titulo: true,
            largura: "28%",
            celula: (u) => (
              <span className="flex items-center gap-2.5">
                <InitialsAvatar nome={u.name} tamanho="sm" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-medium text-text-primary">{u.name}</span>
                    {u.id === session.user.id && <Tag tom="marca">você</Tag>}
                  </span>
                  <span className="t-meta block truncate">{u.email}</span>
                </span>
              </span>
            ),
          },
          {
            chave: "email",
            cabecalho: "E-mail",
            soNoDesktop: true,
            largura: "26%",
            celula: (u) => (
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="truncate">{u.email}</span>
                {!u.emailVerified && <Tag tom="atencao">não verificado</Tag>}
              </span>
            ),
          },
          {
            chave: "cadastro",
            cabecalho: "Cadastro",
            largura: "14%",
            celula: (u) => <span className="tabular">{formatarData(u.createdAt)}</span>,
          },
          {
            chave: "visto",
            cabecalho: "Visto por último",
            largura: "16%",
            celula: (u) => <span className="tabular">{formatarData(u.lastSeenAt)}</span>,
          },
          {
            chave: "papel",
            cabecalho: "Papel",
            largura: "16%",
            celula: (u) => (
              <RoleSelect userId={u.id} role={u.role} ehVoceMesmo={u.id === session.user.id} />
            ),
          },
        ]}
      />
    </>
  );
}
