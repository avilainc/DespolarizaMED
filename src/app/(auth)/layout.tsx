import Image from "next/image";
import { Logo } from "@/features/marketing/components/logo";

/**
 * A casca das telas de entrar, cadastrar e recuperar senha.
 *
 * Duas colunas no desktop: o formulário à esquerda e, à direita, o que a
 * pessoa está prestes a acessar. A coluna da direita não é decoração — é a
 * única chance de dizer o que é o produto para quem chegou por um link de
 * recuperação de senha e não passou pela landing. No celular ela some, porque
 * ali o formulário é a tela inteira.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <main className="flex flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="mb-7">
          {/* O emblema acima do formulário é o que diz ao aluno que ele está no
              lugar certo antes de digitar a senha. */}
          <Logo tamanho={56} comNome prioridade />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <aside className="relative hidden overflow-hidden bg-brand-800 lg:flex lg:flex-col lg:justify-center lg:px-12">
        <div
          aria-hidden
          className="trama-axonio pointer-events-none absolute inset-0 opacity-[0.18] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        />
        <div className="relative max-w-md">
          <p className="font-display text-[2rem] font-semibold leading-tight tracking-tight text-white">
            Preparação para vestibulares de Medicina.
          </p>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-brand-100">
            Aulas, banco de questões com gabarito conferido, provas antigas para resolver do começo
            ao fim, plano de estudos e plantões ao vivo com os professores.
          </p>
          <Image
            src="/illustrations/marca-axonio.svg"
            alt=""
            aria-hidden
            width={320}
            height={178}
            className="mt-10 h-auto w-72 opacity-90 [filter:brightness(1.6)]"
          />
        </div>
      </aside>
    </div>
  );
}
