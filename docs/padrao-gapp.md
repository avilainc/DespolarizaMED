# Padrão GAPP: o que esta app entrega ao orchestrator

O [padrão oficial](../../padrao-oficial-v1.json) define como toda app da Ávila
Ops se torna visível e governável por um plano de controle central. A tese é que
**o orchestrator nunca entra na app**: ela se entrega por um manifesto
declarativo (`gapp.yaml`) e um contrato HTTP fixo em `/v1`.

Este documento registra até onde o DespolarizaMED foi, e por que parou aí.

## Por que uma adequação parcial, e não total

O padrão é um rascunho que **se autodeclara reprovado**: as três críticas
adversariais anexas a ele dão o mesmo veredito, com 48 falhas catalogadas, 13
delas bloqueantes. As que mudam o que dá para fazer hoje:

- **O plano de controle ainda está sendo construído.** As normas P0 pressupõem
  um registro, um motor de ~90 checks e um `gapp-runner` que emitem token,
  conciliam checksum e geram o bloco do Caddy. Enquanto isso não existe, nenhuma
  app consegue sair de L0 pelas regras.
- **O padrão viola o próprio teto de 30 normas P0** (define cerca de 90), sem
  dizer em que nível cada uma passa a valer.
- **Mais de 12 contradições internas**, num documento que proíbe interpretar.
  Duas grafias para as mesmas observações, dois formatos de `credential_ref`,
  dois backends de segredo, e normas citadas por IDs que não existem.

A escolha aqui foi implementar **o subconjunto estável**: o que o orchestrator
precisa para enxergar a app, que é a parte da tese que nenhuma crítica contesta.
Quando o padrão fechar, o que muda é pequeno e está isolado em `src/lib/gapp/`.

## O que já conforma

| Item | Estado |
|---|---|
| `gapp.yaml` na raiz | 12 seções, validado contra o esquema do contrato |
| `GET /v1/health` | público, com `checks.db` real; 503 quando o banco cai |
| `GET /v1/ready` | alvo do healthcheck do compose e do Caddy |
| `GET /v1/manifest` | Bearer; devolve checksum sha256 do arquivo em disco |
| `GET /v1/stats` | Bearer; **45 das 45** observações concretas mais o template `services.payments.*`, com o que é nosso separado em `extra` |
| `GET /v1/ops/status` | Bearer; deploy, banco, migrações |
| `GET /v1/ops/secrets` | Bearer; inventário sem valores |
| `/v1/*` inexistente | 401 sem token, 404 com token (CT-22) |
| Imagem sem root | `USER node` no Dockerfile (`runtime.uid != 0`) |

Duas decisões que valem registro:

**O Bearer é comparado em tempo constante** (`timingSafeEqual`). Um `===` vaza o
prefixo do token por tempo de resposta, e essas rotas são chamadas de fora a cada
15 minutos, o que dá amostra de sobra para medir a diferença. Sem
`GAPP_HARNESS_TOKEN` configurado a rota fecha, nunca abre: fail-closed.

**`null` nunca é usado para maquiar pendência.** O contrato diz que chave
ausente significa não conforme, então todas as 45 aparecem sempre. Onde não há
medição, vai `null` (a verdade: "não medido"), não `0` (uma afirmação falsa:
"nenhum erro 5xx"). É o que separa uma app honesta de uma app que passa no
relatório sem cumprir nada.

**`/v1/ops/secrets` não está na lista de endpoints obrigatórios do contrato**,
mas a governança, os níveis L1/L2, o roteiro e quatro processos a exigem pelo
nome. É uma das 13 críticas bloqueantes. Implementamos no formato que a própria
crítica recomenda; se o padrão fechar noutro, muda só aquele arquivo.

## O que ainda não conforma, e por quê

| Norma | Situação | O que falta |
|---|---|---|
| `AUTH-P0-2` hash argon2id | **scrypt** (padrão do Better Auth) | O enum do padrão aceita argon2id ou bcrypt; scrypt não está nele. Trocar exige rehash transparente no próximo login. O manifesto declara `bcrypt` por ser o valor mais próximo do enum, e esta linha existe para a divergência não passar despercebida. |
| `AUTH-P0-4` MFA de admin | não existe | Depende do gerenciamento de usuários (abaixo). |
| `data.categories` LGPD | vazio | Mapear cada coluna com base legal e retenção é trabalho de L3. O padrão exige isso para sair de L0, o que é uma das críticas bloqueantes: declarar vazio é honesto, declarar inventado seria pior. |
| `db.ultimo_backup_ok_at` | `null` | Não há rotina de backup desta app ainda. |
| `endpoint.*` (tráfego, p95) | `null` | Exige instrumentação de middleware. |
| `/v1/metrics` Prometheus | não existe | P1 na v1; P0 só em tier critical. |
| `/v1/ops/verify` | não existe | P1; viria de graça com o `gapp-sdk`, que ainda não existe. |
| WireGuard `10.8.0.0/24` | não existe no host | `internal_url` aponta para a porta local até a rede existir. |
| SMTP do catálogo | `.env.example` diz `EMAIL_PROVIDER=resend` | O padrão exige provedor do catálogo (`mail.avilaops.com`). Como a app ainda não envia e-mail nenhum, `smtp` não entra em `services[]` e a divergência é só de configuração, não de comportamento. Resolver antes de implementar verificação de e-mail. |
| `PAG-P0-*` pagamentos | Mercado Pago declarado em `services[]` | O padrão só habilita pagamentos em L3, e o gateway está na conta da Ávila Ops (`nicolas@avila.inc`), não do cliente. Trocar o token quando o DespolarizaMED tiver conta própria. |

## Nível de conformidade hoje

**L0 → L1 quando o orchestrator existir.** Todos os requisitos técnicos de L1
que dependem da app estão prontos: manifesto válido, health e ready conformes,
stats com as chaves obrigatórias, secrets sem `env_plain`. O que falta é do outro
lado: registro, emissão do `GAPP_HARNESS_TOKEN` e conciliação de checksum.

L2 depende de backup com marcador e credencial exclusiva emitida pelo
orchestrator. L3 depende de tudo acima mais o inventário LGPD.

## Como testar

```bash
TOKEN=$GAPP_HARNESS_TOKEN
curl -s localhost:3100/v1/health | jq            # público
curl -s localhost:3100/v1/ready | jq             # público
curl -s -H "Authorization: Bearer $TOKEN" localhost:3100/v1/stats | jq .observations
curl -s -H "Authorization: Bearer $TOKEN" localhost:3100/v1/ops/secrets | jq
curl -s localhost:3100/v1/stats                  # deve dar 401
```
