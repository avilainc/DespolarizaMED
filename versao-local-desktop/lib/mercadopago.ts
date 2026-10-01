// Integração via REST direta (sem SDK) com a API de Assinaturas
// (preapproval) do Mercado Pago — cobrança recorrente mensal/anual,
// depósito cai direto na conta MP do Paulo (dá pra puxar via PIX pro Inter).
// Docs: https://www.mercadopago.com.br/developers/pt/reference/subscriptions
const MP_API = 'https://api.mercadopago.com'

export async function createSubscriptionPreapproval(params: {
  reason: string
  payerEmail: string
  amount: number
  frequency: 'month' | 'year'
}) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')

  const res = await fetch(`${MP_API}/preapproval`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: params.reason,
      payer_email: params.payerEmail,
      auto_recurring: {
        frequency: params.frequency === 'year' ? 12 : 1,
        frequency_type: 'months',
        transaction_amount: params.amount,
        currency_id: 'BRL',
      },
      back_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/dashboard`,
      status: 'pending',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Mercado Pago API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<{ id: string; init_point: string }>
}
