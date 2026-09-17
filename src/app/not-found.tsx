import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/features/marketing/components/logo";

/**
 * 404 da aplicação inteira.
 *
 * Sem este arquivo o Next serve a própria tela padrão: "404 — This page could
 * not be found." em fonte de sistema, em inglês, sem marca e sem caminho de
 * volta, num site que é todo em português. Qualquer link antigo compartilhado
 * no Instagram cai aqui, e a impressão era de site abandonado.
 *
 * Não usa o cabeçalho do site de propósito: `not-found.tsx` na raiz é servido
 * fora dos layouts de grupo de rota, então o `SiteHeader` não se aplica — daí
 * a logo e os links de volta aparecerem na própria página.
 */
export const metadata: Metadata = {
  title: "Página não encontrada — DespolarizaMED",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <Logo tamanho={56} />

      <p className="mt-10 text-sm font-semibold uppercase tracking-wide text-primary">Erro 404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Esta página não existe
      </h1>
      <p className="mt-3 text-muted-foreground">
        O endereço pode ter mudado, ou o link que você seguiu está desatualizado. O conteúdo
        continua no lugar — é só escolher por onde entrar.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Voltar para a página inicial
        </Link>
        <Link href="/#planos" className={buttonVariants({ size: "lg", variant: "outline" })}>
          Ver os planos
        </Link>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Já é assinante?{" "}
        <Link href="/login" className="font-medium text-primary underline underline-offset-4">
          Entrar na plataforma
        </Link>
      </p>
    </main>
  );
}
