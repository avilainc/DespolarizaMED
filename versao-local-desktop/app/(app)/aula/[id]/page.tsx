'use client'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { VideoPlayer, type VideoProvider } from '@/components/VideoPlayer'

type Lesson = {
  id: string
  title: string
  description: string | null
  video_provider: VideoProvider | null
  video_id: string | null
  module_id: string
}
type SiblingLesson = { id: string; title: string }

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [prevLesson, setPrevLesson] = useState<SiblingLesson | null>(null)
  const [nextLesson, setNextLesson] = useState<SiblingLesson | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('lessons')
        .select('id, title, description, video_provider, video_id, module_id')
        .eq('id', id)
        .maybeSingle()
      setLesson(data)

      // Aula anterior/posterior — dentro do mesmo módulo, por ordem de exibição.
      if (data) {
        const { data: siblings } = await supabase
          .from('lessons')
          .select('id, title, sort_order')
          .eq('module_id', data.module_id)
          .order('sort_order')

        if (siblings) {
          const index = siblings.findIndex((l) => l.id === data.id)
          setPrevLesson(index > 0 ? siblings[index - 1] : null)
          setNextLesson(index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null)
        }
      }
      setLoading(false)
    }
    if (id) load()
  }, [id])

  return (
    <div className="min-h-screen bg-app px-4 sm:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-5 transition">
          <ChevronLeft size={16} /> Voltar
        </Link>

        <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-edge">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">Carregando...</div>
          ) : lesson ? (
            <VideoPlayer provider={lesson.video_provider || 'drive'} videoId={lesson.video_id || ''} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
              Aula não encontrada — crie uma em /admin/cursos
            </div>
          )}
        </div>

        <h1 className="text-xl font-bold text-fg mt-6 mb-2">{lesson?.title || `Aula ${id}`}</h1>
        <p className="text-muted text-sm mb-6">{lesson?.description || 'Material de apoio e resumo em breve.'}</p>

        <div className="flex items-center justify-between border-t border-edge pt-5">
          {prevLesson ? (
            <Link
              href={`/aula/${prevLesson.id}`}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-lg border border-edge hover:border-primary/50 transition max-w-[48%]"
            >
              <ChevronLeft size={16} className="text-faint group-hover:text-primary transition shrink-0" />
              <span className="min-w-0">
                <span className="block text-[10px] text-faint uppercase tracking-wide">Aula anterior</span>
                <span className="block text-sm text-fg truncate">{prevLesson.title}</span>
              </span>
            </Link>
          ) : <span />}

          {nextLesson ? (
            <Link
              href={`/aula/${nextLesson.id}`}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-dark transition max-w-[48%] text-right"
            >
              <span className="min-w-0">
                <span className="block text-[10px] text-white/70 uppercase tracking-wide">Próxima aula</span>
                <span className="block text-sm text-white font-medium truncate">{nextLesson.title}</span>
              </span>
              <ChevronRight size={16} className="text-white shrink-0" />
            </Link>
          ) : <span />}
        </div>
      </div>
    </div>
  )
}
