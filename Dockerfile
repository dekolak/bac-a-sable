# ── Dockerfile (déploiement Coolify / conteneur) ──────────────
# Build multi-étapes. Au démarrage : applique les migrations puis lance
# le serveur Next.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `prisma generate` est appelé par le script build.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
# migrate deploy est idempotent ; le seed ne crée l'admin que si
# ADMIN_EMAIL / ADMIN_PASSWORD sont fournis.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run start"]
