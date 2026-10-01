// Player embutido do Panda Video (streaming HLS via iframe — sem botão de
// download nativo, o que resolve o "não deixar baixar" sem precisar de DRM).
// NEXT_PUBLIC_PANDA_PLAYER_HOST vem do painel do Panda quando a biblioteca
// de vídeos for criada (formato: https://player-vz-XXXX.tv.pandavideo.com.br).
export function PandaPlayer({ videoId }: { videoId: string }) {
  const host = process.env.NEXT_PUBLIC_PANDA_PLAYER_HOST

  if (!host) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-slate-500 text-sm">Player de vídeo — biblioteca do Panda Video ainda não configurada</p>
      </div>
    )
  }

  return (
    <iframe
      src={`${host}/embed/?v=${videoId}`}
      className="w-full h-full border-0"
      allow="accelerometer *; gyroscope *; autoplay *; encrypted-media *; picture-in-picture *; fullscreen *;"
      allowFullScreen
      title={`Aula ${videoId}`}
    />
  )
}
