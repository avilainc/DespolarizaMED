# billing

Planos, assinatura recorrente pelo Mercado Pago, webhook de pagamento, cupons.

Dados em `src/lib/db/schema/billing.ts`: `plans`, `subscriptions`, `payments`,
`coupons`, `payment_events`.

## Como o acesso é liberado

```
aluno escolhe plano (/planos)
        v
assinar()  -> cria subscriptions PENDING + preapproval no MP
        v
aluno paga no Mercado Pago
        v
POST /api/webhooks/mercadopago  (assinatura HMAC validada)
        v
consulta a API do MP pelo id  <- o corpo da notificacao nao e acreditado
        v
subscriptions.status = ACTIVE
```

O acesso **nunca** depende do retorno do navegador: quem volta de
`/dashboard` pode ter apenas editado a URL. Quem libera é o webhook.

`requireAssinatura()` (`src/lib/auth/require-subscription.ts`) é o portão das
telas pagas. ADMIN e TEACHER entram sem assinatura, porque são quem produz o
conteúdo.

`PAST_DUE` continua com acesso enquanto `currentPeriodEnd` não passou: o MP
demora a reprocessar cartão recusado, e cortar quem já pagou o mês por causa
de uma falha na renovação seria errado.

## Scripts

```bash
pnpm seed:planos   # cria/atualiza os 3 planos no banco e no MP (idempotente)
```

Preços ficam no banco, nunca no frontend, para mudarem pelo painel.
