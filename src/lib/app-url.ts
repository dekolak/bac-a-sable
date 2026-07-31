import "server-only";
import { headers } from "next/headers";

/**
 * URL publique de la plateforme, résolue À L'EXÉCUTION (sert à construire
 * le snippet d'embed d'un bloc public).
 *
 * On n'utilise PAS de variable `NEXT_PUBLIC_*` : celles-ci sont figées au
 * build, donc une valeur définie dans Coolify serait ignorée. Ici :
 *   1. `APP_URL` (variable runtime classique) si elle est fournie ;
 *   2. sinon, l'hôte de la requête (headers du reverse-proxy) — donc
 *      correct même sans configuration.
 */
export async function getAppUrl(): Promise<string> {
  const explicit = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (explicit) return explicit;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
