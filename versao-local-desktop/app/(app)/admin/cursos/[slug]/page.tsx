'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, ChevronLeft, PlayCircle } from 'lucide-react'
import Link from 'next/link'

type Course = { id: string; slug: string; title: string; subject: string; published: boolean }
type Module = { id: string; title: string; sort_order: number }
type Lesson = { id: string; module_id: string; title: string; video_id: string | null; video_provider: string | null; is_free_preview: boolean; sort_order: number }

export default function AdminCourseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const emptyLessonForm = { title: '', videoId: '', provider: 'drive' }
  const [lessonForms, setLessonForms] = useState<Record<string, typeof emptyLessonForm>>({})

  const lessonForm = (moduleId: string) => lessonForms[moduleId] ?? emptyLessonForm
  const setLessonForm = (moduleId: string, patch: Partial<typeof emptyLessonForm>) =>
    setLessonForms((prev) => ({ ...prev, [moduleId]: { ...lessonForm(moduleId), ...patch } }))

  async function load() {
    setLoading(true)
    const { data: courseData } = await supabase.from('courses').select('*').eq('slug', slug).maybeSingle()
    if (!courseData) { setLoading(false); return }
    setCourse(courseData)

    const { data: moduleData } = await supabase.from('modules').select('*').eq('course_id', courseData.id).order('sort_order')
    setModules(moduleData ?? [])

    if (moduleData?.length) {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .in('module_id', moduleData.map((m) => m.id))
        .order('sort_order')
      setLessons(lessonData ?? [])
    } else {
      setLessons([])
    }
    setLoading(false)
  }

  useEffect(() => { if (slug) load() }, [slug])

  const togglePublish = async () => {
    if (!course) return
    await supabase.from('courses').update({ published: !course.published }).eq('id', course.id)
    load()
  }

  const addModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!course || !newModuleTitle.trim()) return
    await supabase.from('modules').insert({ course_id: course.id, title: newModuleTitle, sort_order: modules.length })
    setNewModuleTitle('')
    load()
  }

  const addLesson = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault()
    const form = lessonForm(moduleId)
    if (!form.title.trim()) return
    const moduleLessons = lessons.filter((l) => l.module_id === moduleId)
    await supabase.from('lessons').insert({
      module_id: moduleId,
      title: form.title,
      video_provider: form.provider,
      video_id: form.videoId || null,
      sort_order: moduleLessons.length,
    })
    setLessonForms((prev) => ({ ...prev, [moduleId]: emptyLessonForm }))
    load()
  }

  if (loading) return <div className="px-6 py-8 text-muted text-sm">Carregando...</div>
  if (!course) return <div className="px-6 py-8 text-muted text-sm">Curso não encontrado.</div>

  return (
    <div className="px-6 py-8 max-w-3xl">
      <Link href="/admin/cursos" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-5 transition">
        <ChevronLeft size={16} /> Cursos
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">{course.title}</h1>
          <p className="text-muted text-sm">{course.subject}</p>
        </div>
        <button
          onClick={togglePublish}
          className={`text-sm font-semibold px-4 py-2 rounded-lg transition ${
            course.published ? 'bg-teal/15 text-teal-dark border border-teal/30' : 'bg-surface border border-edge text-muted'
          }`}
        >
          {course.published ? 'Publicado' : 'Publicar curso'}
        </button>
      </div>

      <form onSubmit={addModule} className="flex gap-2 mb-6">
        <input
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          placeholder="Nome do módulo (ex: Bioquímica)"
          className="flex-1 px-3 py-2 bg-surface border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
        />
        <button type="submit" className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          <Plus size={16} /> Módulo
        </button>
      </form>

      <div className="space-y-5">
        {modules.map((module) => (
          <div key={module.id} className="bg-surface border border-edge rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-edge font-semibold text-fg text-sm">{module.title}</div>
            <div className="divide-y divide-edge">
              {lessons.filter((l) => l.module_id === module.id).map((lesson) => (
                <div key={lesson.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className="text-fg">{lesson.title}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-faint text-xs">{lesson.video_id ? `${lesson.video_provider} · ${lesson.video_id}` : 'sem vídeo'}</span>
                    {lesson.video_id && (
                      <Link href={`/aula/${lesson.id}`} target="_blank" className="text-primary-light hover:text-fg transition inline-flex items-center gap-1">
                        <PlayCircle size={14} /> Ver aula
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => addLesson(e, module.id)}
              className="px-5 py-3 bg-app/40 flex flex-col sm:flex-row gap-2"
            >
              <input
                value={lessonForm(module.id).title}
                onChange={(e) => setLessonForm(module.id, { title: e.target.value })}
                placeholder="Título da aula"
                className="flex-1 px-3 py-1.5 bg-surface border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
              />
              <select
                value={lessonForm(module.id).provider}
                onChange={(e) => setLessonForm(module.id, { provider: e.target.value })}
                className="sm:w-28 px-2 py-1.5 bg-surface border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
              >
                <option value="drive">Drive</option>
                <option value="panda">Panda</option>
              </select>
              <input
                value={lessonForm(module.id).videoId}
                onChange={(e) => setLessonForm(module.id, { videoId: e.target.value })}
                placeholder={lessonForm(module.id).provider === 'drive' ? 'ID do arquivo no Drive' : 'ID do vídeo no Panda'}
                className="sm:w-48 px-3 py-1.5 bg-surface border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
              />
              <button type="submit" className="text-primary-light text-sm font-medium px-3 py-1.5 hover:text-fg transition shrink-0">
                + Aula
              </button>
            </form>
          </div>
        ))}
        {modules.length === 0 && <p className="text-muted text-sm">Nenhum módulo ainda — crie um acima.</p>}
      </div>
    </div>
  )
}
