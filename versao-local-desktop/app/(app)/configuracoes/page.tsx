'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Camera, Check, X } from 'lucide-react'

type Profile = {
  name: string | null
  avatar_url: string | null
  school_type: 'escola' | 'cursinho' | null
  school_years: number | null
  desired_course: string | null
  target_universities: string[] | null
}

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>({ name: '', avatar_url: null, school_type: null, school_years: null, desired_course: '', target_universities: [] })
  const [universityDraft, setUniversityDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) return
      setUserId(data.user.id)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, avatar_url, school_type, school_years, desired_course, target_universities')
        .eq('id', data.user.id)
        .maybeSingle()
      if (profileData) setProfile(profileData)
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    await supabase.from('profiles').update({
      name: profile.name,
      school_type: profile.school_type,
      school_years: profile.school_years,
      desired_course: profile.desired_course,
      target_universities: profile.target_universities,
    }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const addUniversity = () => {
    const value = universityDraft.trim()
    if (!value) return
    setProfile((p) => ({ ...p, target_universities: [...(p.target_universities || []), value] }))
    setUniversityDraft('')
  }

  const removeUniversity = (uni: string) => {
    setProfile((p) => ({ ...p, target_universities: (p.target_universities || []).filter((u) => u !== uni) }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)

    const path = `${userId}/avatar-${Date.now()}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: publicUrl.publicUrl }).eq('id', userId)
      setProfile((p) => ({ ...p, avatar_url: publicUrl.publicUrl }))
    }
    setUploading(false)
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-6">Configurações</h1>

      <div className="bg-surface border border-edge rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/15 overflow-hidden flex items-center justify-center border border-edge">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-bold text-xl">{profile.name?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-dark transition">
              <Camera size={12} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <p className="text-fg font-medium text-sm">Foto de perfil</p>
            <p className="text-faint text-xs">{uploading ? 'Enviando...' : 'Clique no ícone pra trocar'}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-muted text-sm font-medium mb-1.5">Nome</label>
            <input
              value={profile.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-muted text-sm font-medium mb-1.5">Você estuda em...</label>
            <div className="flex gap-2">
              {(['escola', 'cursinho'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProfile({ ...profile, school_type: type })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition capitalize ${
                    profile.school_type === type
                      ? 'bg-primary/15 border-primary text-primary-light'
                      : 'bg-app border-edge text-muted hover:border-primary/40'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-muted text-sm font-medium mb-1.5">
              Há quantos anos {profile.school_type === 'cursinho' ? 'faz cursinho' : profile.school_type === 'escola' ? 'está nessa fase' : 'estuda assim'}?
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={profile.school_years ?? ''}
              onChange={(e) => setProfile({ ...profile, school_years: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
              placeholder="Ex: 1"
            />
          </div>

          <div>
            <label className="block text-muted text-sm font-medium mb-1.5">Curso desejado</label>
            <input
              value={profile.desired_course || ''}
              onChange={(e) => setProfile({ ...profile, desired_course: e.target.value })}
              placeholder="Ex: Medicina"
              className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-muted text-sm font-medium mb-1.5">Faculdades que pretende prestar</label>
            <div className="flex gap-2 mb-2">
              <input
                value={universityDraft}
                onChange={(e) => setUniversityDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUniversity() } }}
                placeholder="Ex: USP — pressione Enter"
                className="flex-1 px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
              />
              <button type="button" onClick={addUniversity} className="px-3 py-2 bg-surface-2 border border-edge rounded-lg text-muted text-sm hover:text-fg transition">
                Adicionar
              </button>
            </div>
            {!!profile.target_universities?.length && (
              <div className="flex flex-wrap gap-2">
                {profile.target_universities.map((uni) => (
                  <span key={uni} className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary-light text-xs px-2.5 py-1 rounded-full">
                    {uni}
                    <button type="button" onClick={() => removeUniversity(uni)} aria-label={`Remover ${uni}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {saved ? <><Check size={15} /> Salvo</> : saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
