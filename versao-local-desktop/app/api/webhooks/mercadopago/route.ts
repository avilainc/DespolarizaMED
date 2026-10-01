import { NextRequest, NextResponse } from 'next/server'

// Mercado Pago notifica aqui quando o status de uma assinatura muda
// (ativada, pagamento recusado, cancelada). TODO assim que o Supabase
// estiver plugado: buscar a preapproval por id na API do MP e fazer
// upsert em `subscriptions` (status/current_period_end) com a service role key.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  console.log('[mercadopago webhook]', body)
  return NextResponse.json({ received: true })
}
