import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/chip";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { ITEM_PLANOS } from "./navegacao";
import { cn } from "@/lib/utils";

/**
 * Rodapé de identidade da barra lateral e do menu do celular.
 *
 * Mostra quem está logado e o plano vigente — não o e-mail, que numa barra de
 * 264px trunca no meio e não diz nada que o aluno já não saiba. O e-mail
 * continua em /minha-conta, que é onde se mexe nele.
 */
export function UserFooter({
  nome,
  plano,
  className,
}: {
  nome: string;
  /** Nome do plano vigente, ou null quando não há assinatura. */
  plano: string | null;
  className?: string;
}) {
  return (
    <div className={cn("border-t border-border p-3", className)}>
      <Link
        href="/minha-conta"
        className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-subtle"
      >
        <InitialsAvatar nome={nome} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.875rem] font-medium text-text-primary">
            {nome}
          </span>
          <span className="block truncate text-[0.75rem] text-text-muted">
            {plano ? `Plano ${plano}` : "Sem assinatura ativa"}
          </span>
        </span>
      </Link>

      <div className="mt-1 flex items-center gap-1">
        <Link
          href="/minha-conta"
          className="inline-flex min-h-9 flex-1 items-center gap-2 rounded-lg px-3 text-[0.8125rem] font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
        >
          <User aria-hidden className="size-4 shrink-0 text-text-muted" />
          Minha conta
        </Link>
        <SignOutButton
          variant="ghost"
          size="sm"
          className="min-h-9 gap-2 px-3 text-text-secondary hover:text-text-primary"
        >
          <LogOut aria-hidden className="size-4 text-text-muted" />
          Sair
        </SignOutButton>
      </div>

      {!plano && (
        <Link
          href={ITEM_PLANOS.href}
          className="mt-1 flex min-h-9 items-center gap-2 rounded-lg px-3 text-[0.8125rem] font-medium text-brand-700 transition-colors hover:bg-brand-50"
        >
          <ITEM_PLANOS.icone aria-hidden className="size-4 shrink-0" />
          {ITEM_PLANOS.rotulo}
        </Link>
      )}
    </div>
  );
}
