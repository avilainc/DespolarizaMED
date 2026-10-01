import { NextRequest, NextResponse } from 'next/server'
import { createSubscriptionPreapproval } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  const { reason, payerEmail, amount, frequency } = await req.json()

  if (!reason || !payerEmail || !amount || !frequency) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  try {
    const preapproval = await createSubscriptionPreapproval({ reason, payerEmail, amount, frequency })
    return NextResponse.json({ init_point: preapproval.init_point })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar assinatura'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
