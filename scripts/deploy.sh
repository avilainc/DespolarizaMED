#!/usr/bin/env bash
# Deploy do DespolarizaMED no host applications (Hetzner).
#
# Padrão da casa: o build acontece AQUI, na máquina de desenvolvimento, e só o
# resultado viaja. O CX23 do servidor não tem folga de RAM para compilar
# Next.js sem derrubar os outros containers que dividem a máquina.
#
#   build local -> tgz -> docker build no servidor -> compose up
#
# Uso: bash scripts/deploy.sh [versao]
set -euo pipefail

VERSAO="${1:-0.1.0}"
HOST=applications
APP=despolarizamed
COMMIT="$(git rev-parse --short HEAD)"

cd "$(dirname "$0")/.."

echo "==> build $VERSAO ($COMMIT)"
rm -rf .next
CI=true APP_VERSION="$VERSAO" GIT_COMMIT="$COMMIT" pnpm build

# Sem .env.local no pacote: em outro projeto da casa ele vazou para dentro da
# imagem e sobrescreveu a configuração de produção. Os segredos de produção
# vivem só em /etc/gapp/<app>/secrets.env, no servidor.
echo "==> empacotando"
tar czf /tmp/$APP.tgz \
  .next/standalone .next/static public gapp.yaml Dockerfile

echo "==> enviando"
ssh "$HOST" "mkdir -p /opt/$APP/build"
# scp em vez de rsync: o servidor não tem rsync instalado.
scp /tmp/$APP.tgz "$HOST:/opt/$APP/build/"

echo "==> imagem e subida"
ssh "$HOST" bash -s <<REMOTE
set -euo pipefail
cd /opt/$APP/build
rm -rf ctx && mkdir ctx && tar xzf $APP.tgz -C ctx
cd ctx
docker build -t $APP:$VERSAO .
cd /opt/$APP
sed -i "s|image: $APP:.*|image: $APP:$VERSAO|" compose.yaml
docker compose up -d
REMOTE

echo "==> verificando"
sleep 10
ssh "$HOST" "curl -sf http://127.0.0.1:3100/v1/health | head -c 300; echo"
echo "==> ok"
