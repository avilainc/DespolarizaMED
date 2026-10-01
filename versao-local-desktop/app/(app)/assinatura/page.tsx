'use client'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Preços fictícios — aguardando Paulo definir o valor final. O plano vira
// uma linha real na tabela `plans` assim que o Supabase estiver plugado;
// por ora os dados de cobrança são montados aqui mesmo.
const plans = [
  { id: 'mensal', name: 'Mensal', price: 49.9, priceLabel: 'R$ 49,90', interval: '/mês', frequency: 'month' as const },
  { id: 'anual', name: 'Anual', price: 39.9, priceLabel: 'R$ 39,90', interval: '/mês', frequency: 'year' as const, badge: 'Economize 20%' },
]

export default function SubscriptionPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSubscribe = async (plan: (typeof plans)[number]) => {
    setError('')
    setLoadingPlan(plan.id)

    try {
      const { data: userData } = await supabase.auth.getUser()
      const payerEmail = userData?.user?.email
      if (!payerEmail) {
        setError('Faça login antes de assinar.')
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: `DespolarizaMed - Plano ${plan.name}`,
          payerEmail,
          amount: plan.price,
          frequency: plan.frequency,
        }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro ao iniciar assinatura')
      window.location.href = data.init_point
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar assinatura')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-app px-4 sm:px-6 py-16">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-3xl font-bold text-fg mb-2">Assine o DespolarizaMed</h1>
        <p className="text-muted">Acesso completo a todas as aulas e materiais enquanto sua assinatura estiver ativa.</p>
        {error && (
          <p className="mt-4 text-red-500 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 inline-block">
            {error}
          </p>
        )}
      </div>

      <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-surface border border-edge rounded-2xl p-6 relative">
            {plan.badge && (
              <span className="absolute -top-3 right-6 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                {plan.badge}
              </span>
            )}
            <h3 className="text-fg font-semibold mb-1">{plan.name}</h3>
            <p className="text-3xl font-extrabold text-fg mb-1">
              {plan.priceLabel}<span className="text-base font-medium text-muted">{plan.interval}</span>
            </p>
            <ul className="text-muted text-sm space-y-2 my-5">
              <li className="flex items-center gap-2"><Check size={16} className="text-teal" /> Todas as videoaulas</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-teal" /> Material de apoio</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-teal" /> Cancele quando quiser</li>
            </ul>
            <button
              onClick={() => handleSubscribe(plan)}
              disabled={loadingPlan !== null}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {loadingPlan === plan.id ? 'Redirecionando...' : 'Assinar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
