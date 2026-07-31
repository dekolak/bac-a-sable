import "server-only";
import { cookies } from "next/headers";
import { cookieSecure } from "@/lib/cookies";

// Les invités (blocs PARTAGE) n'ont pas de compte : après avoir suivi
// leur lien magique, on mémorise les tokens d'invitation acceptés dans
// un cookie httpOnly. Un token = l'accès à UN bloc précis.
const GUEST_COOKIE = "bo_guest";
const GUEST_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 jours

export async function getGuestTokens(): Promise<string[]> {
  const jar = await cookies();
  const raw = jar.get(GUEST_COOKIE)?.value;
  if (!raw) return [];
  return raw.split(".").filter(Boolean);
}

export async function addGuestToken(token: string): Promise<void> {
  const jar = await cookies();
  const current = new Set(await getGuestTokens());
  current.add(token);
  jar.set(GUEST_COOKIE, [...current].join("."), {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + GUEST_TTL_MS),
  });
}
