#!/bin/sh
set -e

# Applique les migrations en attente (idempotent).
echo "→ prisma migrate deploy"
npx prisma migrate deploy

# Crée/met à jour l'admin si ADMIN_EMAIL / ADMIN_PASSWORD sont fournis
# (sans effet sinon — voir prisma/seed.ts).
echo "→ prisma db seed"
npx prisma db seed

echo "→ démarrage Next.js sur le port ${PORT:-3000}"
# On lance Next DIRECTEMENT (pas via `npm run start`) : npm ajoute un process
# `npm` + un `sh` par-dessus `next-server`, et relaie mal les signaux. En
# exec-ant node sur le binaire Next, next-server devient PID 1 → SIGTERM reçu
# proprement au redéploiement (arrêt propre du moteur Prisma) et 2 process en
# moins dans le conteneur.
exec node node_modules/next/dist/bin/next start -p "${PORT:-3000}"
