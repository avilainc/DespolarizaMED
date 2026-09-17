"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";
import { Loader2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    await authClient.requestPasswordReset({
      email,
      redirectTo: "/redefinir-senha",
    });

    setLoading(false);
    // Sempre a mesma confirmação, com erro ou sem: responder "e-mail não
    // cadastrado" entregaria a quem perguntasse quais contas existem.
    setEnviado(true);
  }

  if (enviado) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><h1>Verifique seu e-mail</h1></CardTitle>
          <CardDescription>
            Se houver uma conta com <strong>{email}</strong>, o link para criar uma nova senha
            chegou lá. Ele vale por uma hora.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar para o login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle><h1>Esqueceu a senha?</h1></CardTitle>
        <CardDescription>Enviamos um link para você criar uma nova.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Enviar link
          </Button>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar para o login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
