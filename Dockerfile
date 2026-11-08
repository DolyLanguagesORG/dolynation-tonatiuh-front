# syntax=docker/dockerfile:1.7
# Multi-stage build del frontend de DolyNation (Next.js 16).
# Build context: la raiz de este repositorio (dolynation-tonatiuh-front).
#
# La imagen usa `output: 'standalone'` de Next.js: el runner solo lleva el
# server minimo y sus dependencias, no el node_modules completo.

# ─── Stage 1: deps ──────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Solo el lockfile: la capa de dependencias se cachea y no se rehace
# mientras el lock no cambie.
COPY package.json package-lock.json ./
RUN npm ci

# ─── Stage 2: build ─────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# La version y el commit los inyecta el build para que /api/v1/version y la
# cabecera X-App-Version del frontend digan que build es.
ARG GIT_COMMIT=unknown
ARG APP_VERSION=
ARG COMPONENT=dolynation-tonatiuh-front
ARG BUILT_AT=

ENV GIT_COMMIT=$GIT_COMMIT \
    APP_VERSION=$APP_VERSION \
    COMPONENT=$COMPONENT \
    BUILT_AT=$BUILT_AT \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Stage 3: runner ────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Usuario sin privilegios (lo trae la imagen oficial de node).
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# El server standalone de Next.js ya trae las dependencias minimas.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Los assets estaticos y publicos no van dentro del standalone.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
