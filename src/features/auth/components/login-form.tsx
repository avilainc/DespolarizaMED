"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { authClient } from "@/lib/auth/client";
import { mensagemDeErro } from "@/features/auth/mensagens";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      // O Better Auth responde em inglês ("Invalid email or password"); ver
      // features/auth/mensagens.ts.
      setError(mensagemDeErro(signInError, "Não foi possível entrar. Verifique seus dados."));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-7 shadow-sm sm:p-8">
      <h1 className="t-page-title text-text-primary">Entrar</h1>
      <p className="mt-1.5 text-text-secondary">Acesse sua conta para continuar seus estudos.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
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

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label htmlFor="password" className="t-label">
              Senha
              <span className="ml-1 text-danger-text" aria-hidden>
                *
              </span>
            </label>
            <Link
              href="/esqueci-a-senha"
              className="text-[0.8125rem] font-medium text-brand-600 hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <TextField
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-[0.875rem] text-danger-text">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" variant="brand" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" data-icon="inline-start" aria-hidden />}
          Entrar
        </Button>
      </form>

      <p className="mt-6 border-t border-border pt-5 text-center text-[0.875rem] text-text-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-brand-600 hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
