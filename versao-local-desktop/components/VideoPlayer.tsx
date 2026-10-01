import { PandaPlayer } from './PandaPlayer'
import { DriveEmbed } from './DriveEmbed'

export type VideoProvider = 'drive' | 'panda' | 'bunny' | 'vimeo' | 'youtube'

export function VideoPlayer({ provider, videoId }: { provider: VideoProvider; videoId: string }) {
  if (!videoId) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-slate-500 text-sm">Vídeo ainda não cadastrado pra essa aula</p>
      </div>
    )
  }

  switch (provider) {
    case 'drive':
      return <DriveEmbed fileId={videoId} />
    case 'panda':
      return <PandaPlayer videoId={videoId} />
    default:
      return (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-slate-500 text-sm">Provedor de vídeo "{provider}" ainda não suportado</p>
        </div>
      )
  }
}
