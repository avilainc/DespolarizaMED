# Compilacao executada pelo GitHub Actions.
FROM node:24-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:24-slim AS runtime

# Usuario nao root: exigencia do padrao GAPP (runtime.uid != 0). A imagem
# node ja traz o usuario "node" com uid 1000.
WORKDIR /app

# O standalone traz server.js e as dependencias resolvidas; static e public
# ficam fora dele e precisam ser copiados a parte.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# O manifesto e lido em runtime por GET /v1/manifest, e o checksum precisa
# bater com o do repositorio: copiado cru, sem reserializar.
COPY --from=build --chown=node:node /app/gapp.yaml ./gapp.yaml

USER node

ENV NODE_ENV=production
ENV PORT=3100
ENV HOSTNAME=0.0.0.0

EXPOSE 3100

# O healthcheck do compose aponta para /v1/ready, que e a rota que diz se a
# app pode RECEBER TRAFEGO (banco conectado), nao apenas se esta viva.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=30s \
  CMD node -e "fetch('http://127.0.0.1:3100/v1/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
