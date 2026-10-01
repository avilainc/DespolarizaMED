'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Plus, ChevronRight } from 'lucide-react'

type Course = { id: string; slug: string; title: string; subject: string; published: boolean }

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', slug: '', subject: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadCourses() {
    setLoading(true)
    const { data } = await supabase.from('courses').select('id, slug, title, subject, published').order('sort_order')
    setCourses(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadCourses() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error } = await supabase.from('courses').insert({
      title: form.title,
      slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      subject: form.subject,
      published: false,
    })

    if (error) {
      setError(error.message)
    } else {
      setForm({ title: '', slug: '', subject: '' })
      setShowForm(false)
      loadCourses()
    }
    setSaving(false)
  }

  return (
    <div className="px-6 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg">Cursos</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> Novo curso
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-edge rounded-2xl p-5 mb-6 space-y-3">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label className="block text-muted text-sm font-medium mb-1">Título</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg focus:outline-none focus:border-primary"
              placeholder="Ex: Biologia para Vestibular"
              required
            />
          </div>
          <div>
            <label className="block text-muted text-sm font-medium mb-1">Matéria</label>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg focus:outline-none focus:border-primary"
              placeholder="Ex: Biologia"
              required
            />
          </div>
          <div>
            <label className="block text-muted text-sm font-medium mb-1">Slug (opcional)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg focus:outline-none focus:border-primary"
              placeholder="biologia"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Criar curso'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-muted text-sm">Carregando...</p>
      ) : courses.length === 0 ? (
        <p className="text-muted text-sm">Nenhum curso cadastrado ainda.</p>
      ) : (
        <div className="bg-surface border border-edge rounded-2xl divide-y divide-edge overflow-hidden">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/admin/cursos/${course.slug}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition"
            >
              <div>
                <p className="text-fg font-medium">{course.title}</p>
                <p className="text-faint text-xs">{course.subject} · {course.published ? 'Publicado' : 'Rascunho'}</p>
              </div>
              <ChevronRight size={16} className="text-faint" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
