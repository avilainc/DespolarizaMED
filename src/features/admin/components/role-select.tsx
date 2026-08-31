"use client";

import { useState, useTransition } from "react";
import { alterarPapel } from "../actions";
import type { UserRole } from "@/lib/auth/rbac";

const OPCOES: { valor: UserRole; rotulo: string }[] = [
  { valor: "STUDENT", rotulo: "Aluno" },
  { valor: "TEACHER", rotulo: "Professor" },
  { valor: "ADMIN", rotulo: "Administrador" },
];

export function RoleSelect({
  userId,
  role,
  ehVoceMesmo,
}: {
  userId: string;
  role: UserRole;
  ehVoceMesmo: boolean;
}) {
  const [pendente, startTransition] = useTransition();
  const [valor, setValor] = useState<UserRole>(role);
  const [erro, setErro] = useState<string | null>(null);

  function aoMudar(novo: UserRole) {
    const anterior = valor;
    setValor(novo);
    setErro(null);

    startTransition(async () => {
      const form = new FormData();
      form.set("userId", userId);
      form.set("role", novo);

      const r = await alterarPapel(form);
      // O servidor recusa por regra (último admin, você mesmo); a tela volta ao
      // valor anterior para não mostrar um estado que o banco não tem.
      if (!r.ok) {
        setValor(anterior);
        setErro(r.erro);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={valor}
        disabled={pendente}
        aria-label="Papel"
        onChange={(e) => aoMudar(e.target.value as UserRole)}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm disabled:opacity-50"
      >
        {OPCOES.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {ehVoceMesmo && valor === "ADMIN" && (
        <span className="text-xs text-muted-foreground">não dá para rebaixar a si mesmo</span>
      )}
      {erro && (
        <span role="alert" className="text-xs text-destructive">
          {erro}
        </span>
      )}
    </div>
  );
}
