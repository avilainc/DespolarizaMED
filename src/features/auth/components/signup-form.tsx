"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl"><h1>Criar conta</h1></CardTitle>
        <CardDescription>
          {planoEscolhido
            ? "Crie sua conta para concluir a assinatura."
            : "Comece sua preparação para Medicina hoje mesmo."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome completo"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="voce@email.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="me-2 size-4 animate-spin" />}
            {planoEscolhido ? "Criar conta e continuar" : "Criar conta"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-primary underline underline-offset-4">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
