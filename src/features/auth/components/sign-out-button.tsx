"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

/**
 * Sair. Aceita a aparência por props porque aparece em dois lugares com pesos
 * diferentes: como item de menu no rodapé da barra lateral (fantasma, junto de
 * "Minha conta") e como botão isolado onde não houver barra.
 *
 * O estado de carregando existe porque `signOut` faz uma ida ao servidor: sem
 * ele, o segundo clique dispara uma segunda chamada e a navegação corre junto
 * com a primeira.
 */
export function SignOutButton({
  variant = "outline",
  size = "sm",
  className,
  children,
}: {
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function handleSignOut() {
    if (saindo) return;
    setSaindo(true);
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } finally {
      setSaindo(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      disabled={saindo}
    >
      {saindo ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children ?? "Sair"}
    </Button>
  );
}
