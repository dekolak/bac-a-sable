import { readFileSync } from "fs";
import { NO_CACHE_HEADERS } from "@/lib/no-cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Route de santé / observabilité : expose le nombre de threads du process
// (c'est ce que compte le PIDS de Docker), l'empreinte mémoire et le nombre de
// ressources actives. Sert à SUIVRE le compteur de threads dans le temps après
// la correction du moteur Prisma :
//   watch -n 60 'curl -s https://outils.dekolak.fr/api/sante'
// Si `threads` reste stable = pas de fuite ; s'il remonte lentement = piste
// reconnexions Prisma (vérifier pg_stat_activity + connection_limit).
//
// Volontairement public et sans secret : seulement des compteurs grossiers.
function lireThreads(): number | null {
  try {
    const status = readFileSync("/proc/self/status", "utf8");
    const m = status.match(/^Threads:\s*(\d+)/m);
    return m ? parseInt(m[1], 10) : null;
  } catch {
    return null; // non-Linux / /proc indisponible
  }
}

export async function GET() {
  const mem = process.memoryUsage();
  let handles: number | null = null;
  try {
    handles = process.getActiveResourcesInfo().length;
  } catch {
    handles = null;
  }

  return Response.json(
    {
      ok: true,
      threads: lireThreads(),
      rssMo: Math.round(mem.rss / 1024 / 1024),
      handles,
      uptimeS: Math.round(process.uptime()),
    },
    { headers: NO_CACHE_HEADERS },
  );
}
