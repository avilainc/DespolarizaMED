# billing

Planos, assinatura, checkout Mercado Pago, webhooks de pagamento, cupons.

Dados em `src/lib/db/schema/billing.ts`: `plans`, `subscriptions`, `payments`, `coupons`, `payment_events`. Webhook do Mercado Pago deve validar a assinatura no backend antes de liberar acesso, nunca confiar apenas no retorno do navegador (ver `docs/product-plan.md` seção 21).
