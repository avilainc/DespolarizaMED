#!/bin/sh
# Entrypoint da imagem: migra o banco e só então sobe o servidor.
#
# `set -e` é o ponto todo do arquivo: se `migrar.mjs` sair diferente de zero, o
# container morre aqui e o deploy falha de forma visível. Sem isso, o servidor
# subiria com o schema velho, responderia 200 no healthcheck e o defeito só
# apareceria na tela do aluno.
#
# MIGRAR=0 desliga o passo, para o caso de precisar subir a app sem tocar no
# banco (investigar um incidente, por exemplo). /v1/ready continua reprovando
# enquanto houver drift, então isso não vira um jeito silencioso de contornar.
set -e

# Resolvido a partir do próprio script, e não fixo em /app: assim o entrypoint
# roda igual dentro da imagem e fora dela (é o que permite testá-lo contra um
# Postgres de verdade sem subir container), e não quebra se o WORKDIR mudar.
AQUI="$(cd "$(dirname "$0")" && pwd)"

if [ "${MIGRAR:-1}" = "1" ]; then
  node "$AQUI/scripts/migrar.mjs"
else
  echo "entrypoint: MIGRAR=0, pulando as migrations"
fi

exec node server.js
