import { Logo } from "@/features/marketing/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 px-4 py-12">
      {/* O emblema acima do formulário é o que diz ao aluno que ele está no
          lugar certo antes de digitar a senha. */}
      <div className="mb-8">
        <Logo tamanho={64} comNome={false} prioridade />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
