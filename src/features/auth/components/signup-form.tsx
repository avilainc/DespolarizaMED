"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { authClient } from "@/lib/auth/client";
import { mensagemDeErro } from "@/features/auth/mensagens";
import { Loader2 } from "lucide-react";

/**
 * `planoEscolhido` é o slug que veio de `/cadastro?plano=X`, já validado
 * contra a tabela `plans` pela página.
 *
 * Antes ele era ignorado: a pessoa escolhia o plano na landing, pagava o custo
 * de criar a conta e caía no `/dashboard` sem saber o que fazer em seguida —
 * a perda mais cara possível, porque acontece depois da decisão de compra.
 * Agora o cadastro leva direto para o checkout do plano escolhido.
 */
export function SignupForm({ planoEscolhido }: { planoEscolhido?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(mensagemDeErro(signUpError, "Não foi possível criar sua conta. Tente novamente."));
      return;
    }

    router.push(planoEscolhido ? `/planos?plano=${planoEscolhido}` : "/dashboard");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-7 shadow-sm sm:p-8">
      <h1 className="t-page-title text-text-primary">Criar conta</h1>
      <p className="mt-1.5 text-text-secondary">
        {planoEscolhido
          ? "Crie sua conta para concluir a assinatura."
          : "Comece sua preparação para Medicina hoje mesmo."}
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <Field rotulo="Nome" obrigatorio htmlFor="name">
          <TextField
            id="name"
            type="text"
            placeholder="Seu nome completo"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </Field>

        <Field rotulo="E-mail" obrigatorio htmlFor="email">
          <TextField
            id="email"
            type="email"
            placeholder="voce@email.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </Field>

        <Field rotulo="Senha" obrigatorio htmlFor="password" ajuda="Pelo menos 8 caracteres.">
          {({ id, describedBy }) => (
            <TextField
              id={id}
              aria-describedby={describedBy || undefined}
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
          )}
        </Field>

        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-[0.875rem] text-danger-text">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" variant="brand" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" data-icon="inline-start" aria-hidden />}
          {planoEscolhido ? "Criar conta e continuar" : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 border-t border-border pt-5 text-center text-[0.875rem] text-text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
