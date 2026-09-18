# Compilacao executada pelo GitHub Actions.
FROM node:24-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Valores exclusivos da compilacao. O runtime recebe as credenciais do servidor.
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:1/build \
    BETTER_AUTH_SECRET=compilacao-sem-acesso-a-producao-0000000000 \
    BETTER_AUTH_URL=https://despolarizamed.com.br \
    PAYLOAD_SECRET=compilacao-sem-acesso-a-producao-0000000000 \
    PAYLOAD_DISABLE_PUSH=true pnpm build

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

# O container aplica as proprias migrations antes de servir (ver
# docker-entrypoint.sh). Os .sql nao fazem parte do bundle do Next, entao sao
# copiados a parte; MIGRATIONS_DIR aponta para eles.
COPY --from=build --chown=node:node /app/src/lib/db/migrations ./migrations
COPY --from=build --chown=node:node /app/scripts/migrar.mjs ./scripts/migrar.mjs
# O migrar.mjs roda FORA do bundle do Next, entao precisa resolver estes dois
# como pacotes de verdade. O standalone nao serve: o Next embute o driver no
# chunk do servidor em vez de deixa-lo em node_modules, e o tracing por arquivo
# materializa o .js sem o package.json, que nao carrega. Os dois nao tem
# dependencia de runtime, entao copia-los e autocontido; vem do build stage,
# travados na mesma versao que o lockfile resolveu.
COPY --from=build --chown=node:node /app/node_modules/postgres ./node_modules/postgres
COPY --from=build --chown=node:node /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER node

# GIT_SHA chega como --build-arg (o job `image` do workflow já manda), mas um
# ARG sem ENV correspondente é descartado no fim do build — o binário nunca
# vê. version/commit continuam lidos em runtime (ver src/lib/gapp/manifest.ts,
# buildInfo()) porque não são NEXT_PUBLIC_ e o build não os inlina; isto só
# garante que a IMAGEM já carrega o valor certo como padrão, em vez de
# depender de alguém setar APP_VERSION/GIT_COMMIT à mão no compose do
# servidor a cada deploy — e esquecer, como aconteceu.
ARG GIT_SHA=unknown
ENV GIT_COMMIT=$GIT_SHA
ENV APP_VERSION=sha-$GIT_SHA

ENV NODE_ENV=production
ENV PORT=3100
ENV HOSTNAME=0.0.0.0
ENV MIGRATIONS_DIR=/app/migrations

EXPOSE 3100

# O healthcheck do compose aponta para /v1/ready, que e a rota que diz se a
# app pode RECEBER TRAFEGO (banco conectado), nao apenas se esta viva.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=30s \
  CMD node -e "fetch('http://127.0.0.1:3100/v1/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
