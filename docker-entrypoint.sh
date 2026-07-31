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
exec npm run start -- -p "${PORT:-3000}"
