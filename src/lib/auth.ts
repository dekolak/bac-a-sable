import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cookieSecure } from "@/lib/cookies";

const SESSION_COOKIE = "bo_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 jours

function newToken(): string {
  return randomBytes(32).toString("hex");
}

/** Crée une session serveur et pose le cookie httpOnly correspondant. */
export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await prisma.session.create({
    data: { id: newToken(), userId, expiresAt },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Renvoie l'admin connecté, ou null. Nettoie les sessions expirées. */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (!sid) return null;

  const session = await prisma.session.findUnique({
    where: { id: sid },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: sid } }).catch(() => {});
    return null;
  }
  return session.user;
}

/** Détruit la session courante et efface le cookie. */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (sid) {
    await prisma.session.delete({ where: { id: sid } }).catch(() => {});
  }
  jar.delete(SESSION_COOKIE);
}

/** Garde serveur : exige un admin connecté, sinon redirige vers /login. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
