import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient — mis en cache sur `globalThis` dans TOUS les
// environnements (et pas seulement en dev).
//
// Pourquoi en prod aussi : sous Next.js (App Router), le code serveur est
// bundlé par route. Sans ce cache partagé, plusieurs bundles peuvent évaluer
// `new PrismaClient()` → plusieurs moteurs de requête Prisma, chacun avec son
// runtime et son pool de threads natifs (tokio). Avec ~16 modules qui importent
// ce fichier, cela multiplie les moteurs et fait exploser le nombre de threads
// du process (compteur PIDS Docker). Le cache garantit UN seul client/moteur.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prisma = prisma;
