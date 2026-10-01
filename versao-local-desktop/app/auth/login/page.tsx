'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError('')
    setResetMessage('')
    if (!email.trim()) {
      setError('Digite seu e-mail acima para receber o link de redefinição')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) setError(error.message)
    else setResetMessage('Enviamos um link de redefinição para seu e-mail.')
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(79,128,172,0.18),transparent_60%)]" />

      <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-icon.png" alt="DespolarizaMed" className="w-14 h-14 object-contain mb-3" />
          <h1 className="text-2xl font-bold text-fg">Despolariza<span className="text-accent">Med</span></h1>
        </div>

        <div className="bg-surface rounded-2xl border border-edge p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-fg mb-1">Bem-vindo de volta</h2>
          <p className="text-muted text-sm mb-6">Que bom te ver de novo! Faça seu login.</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 text-sm px-4 py-3 rounded-lg mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}
          {resetMessage && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-500 text-sm px-4 py-3 rounded-lg mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              {resetMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-muted text-sm font-medium mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-app border border-edge rounded-lg text-fg placeholder-faint focus:outline-none focus:border-primary transition"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-muted text-sm font-medium">Senha</label>
                <button type="button" onClick={handleForgotPassword} className="text-xs text-primary-light hover:text-fg transition">
                  Esqueceu sua senha?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 bg-app border border-edge rounded-lg text-fg placeholder-faint focus:outline-none focus:border-primary transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-muted text-sm">
            Não tem uma conta? <Link href="/auth/signup" className="text-primary-light hover:text-fg transition">Cadastre-se</Link>
          </p>
        </div>

        <p className="text-center text-faint text-xs mt-6">
          Ao continuar, você concorda com nossos{' '}
          <Link href="/termos" className="text-muted hover:text-fg underline">Termos de Serviço</Link>
          {' '}e{' '}
          <Link href="/privacidade" className="text-muted hover:text-fg underline">Política de Privacidade</Link>.
        </p>
      </div>
    </div>
  )
}
