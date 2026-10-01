// Tela de carregamento com a marca — mostrada durante a transição entre
// páginas (ver RouteTransition.tsx). Fundo bg-app acompanha o tema.
export function LoadingScreen({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-app flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-[6px] border-edge" />
          <span className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-primary border-r-primary-light animate-spin" />
          <img src="/logo-icon.png" alt="DespolarizaMed" className="w-20 h-20 object-contain" />
        </div>
        <p className="text-muted text-base">{message}</p>
      </div>
    </div>
  )
}
