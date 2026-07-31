# Image de production pour Coolify.
# Multi-étapes : build complet puis image d'exécution.
# Base Debian slim (pas alpine) : le moteur Prisma y est le plus fiable.

# --- Build --------------------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app

# openssl est requis par le moteur Prisma (libquery_engine-debian-openssl-3.0.x).
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# Le schéma DOIT être présent AVANT `npm ci` : le script postinstall lance
# `prisma generate`, qui échoue sinon (« Could not find Prisma Schema »).
# C'est aussi ici que le moteur Prisma est téléchargé → le build a besoin
# d'un accès réseau sortant (registre npm + binaries.prisma.sh).
COPY prisma ./prisma
RUN npm ci

COPY . .
# `build` = prisma generate + next build (voir package.json).
RUN npm run build

# --- Runner -------------------------------------------------------------------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# On réutilise les node_modules du build (client Prisma généré + CLI Prisma et
# tsx pour les migrations et le seed au démarrage).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
# Applique les migrations, seed l'admin, puis démarre Next.
CMD ["./docker-entrypoint.sh"]
