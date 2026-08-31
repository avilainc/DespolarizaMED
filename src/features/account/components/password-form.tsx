"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { Loader2, Check } from "lucide-react";

export function PasswordForm() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [loading, setLoading] = useState(false);

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvo(false);

    if (nova !== confirmacao) return setErro("As senhas novas não são iguais.");
    if (nova.length < 8) return setErro("A nova senha precisa ter pelo menos 8 caracteres.");
    if (nova === atual) return setErro("A nova senha é igual à atual.");

    setLoading(true);
    const { error } = await authClient.changePassword({
      currentPassword: atual,
      newPassword: nova,
      // Derruba as outras sessões: se a troca é por suspeita de acesso
      // indevido, manter os outros aparelhos logados anularia o motivo dela.
      revokeOtherSessions: true,
    });
    setLoading(false);

    if (error) return setErro("Senha atual incorreta.");

    setAtual("");
    setNova("");
    setConfirmacao("");
    setSalvo(true);
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="atual">Senha atual</Label>
        <Input
          id="atual"
          type="password"
          autoComplete="current-password"
          required
          value={atual}
          onChange={(e) => setAtual(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nova">Nova senha</Label>
          <Input
            id="nova"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={nova}
            onChange={(e) => setNova(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmacao">Repita a nova senha</Label>
          <Input
            id="confirmacao"
            type="password"
            autoComplete="new-password"
            required
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />
        </div>
      </div>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          Trocar senha
        </Button>
        {salvo && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Check className="size-4" aria-hidden /> Senha alterada; os outros aparelhos foram desconectados
          </span>
        )}
      </div>
    </form>
  );
}
