import type { Metadata } from "next";
import Link from "next/link";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { listUsers } from "@/features/admin/users";
import { RoleSelect } from "@/features/admin/components/role-select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="mt-1 text-muted-foreground">
            {usuarios.length} {usuarios.length === 1 ? "conta" : "contas"}
          </p>
        </div>
        <Link href="/gestao" className="text-sm text-muted-foreground hover:text-foreground">
          ← Administração
        </Link>
      </div>

      {/* Busca por GET: o filtro fica na URL, então dá para compartilhar e
          voltar para ele pelo histórico do navegador. */}
      <form className="mt-6 flex flex-wrap gap-3" role="search">
        <Input
          name="busca"
          defaultValue={busca ?? ""}
          placeholder="Nome ou e-mail"
          aria-label="Buscar por nome ou e-mail"
          className="max-w-xs"
        />
        <select
          name="papel"
          defaultValue={papel ?? ""}
          aria-label="Filtrar por papel"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          {PAPEIS.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.rotulo}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
              <th className="px-4 py-3 font-medium">Visto por último</th>
              <th className="px-4 py-3 font-medium">Papel</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">{u.name}</span>
                  {u.id === session.user.id && (
                    <Badge variant="secondary" className="ml-2">
                      você
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.email}
                  {!u.emailVerified && (
                    <span
                      className="ml-2 text-xs text-amber-600 dark:text-amber-500"
                      title="E-mail ainda não verificado"
                    >
                      não verificado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatarData(u.createdAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatarData(u.lastSeenAt)}</td>
                <td className="px-4 py-3">
                  <RoleSelect
                    userId={u.id}
                    role={u.role}
                    ehVoceMesmo={u.id === session.user.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
