"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { Loader2 } from "lucide-react";

export function VerifyEmailButton({ email }: { email: string }) {
  const [estado, setEstado] = useState<"parado" | "enviando" | "enviado">("parado");

  async function reenviar() {
    setEstado("enviando");
    await authClient.sendVerificationEmail({ email, callbackURL: "/minha-conta" });
    setEstado("enviado");
  }

  if (estado === "enviado") {
    return <span className="text-sm text-muted-foreground">E-mail de confirmação enviado.</span>;
  }

  return (
    <Button variant="outline" size="sm" onClick={reenviar} disabled={estado === "enviando"}>
      {estado === "enviando" && <Loader2 className="mr-2 size-4 animate-spin" />}
      Reenviar confirmação
    </Button>
  );
}
