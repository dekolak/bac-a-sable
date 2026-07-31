import "server-only";
import type { Bloc } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getGuestTokens } from "@/lib/guest";

/**
 * Décide si la requête courante peut LIRE un bloc, selon sa visibilité :
 *  - PUBLIC  : toujours (embarquable sans connexion)
 *  - PRIVE   : admin connecté uniquement
 *  - PARTAGE : admin, ou invité disposant d'un token valide pour CE bloc
 *
 * L'écriture des données reste, elle, toujours réservée à l'admin
 * (voir les routes /api/blocs/**). L'API publique est en lecture seule.
 */
export async function canReadBloc(bloc: Bloc): Promise<boolean> {
  if (bloc.visibilite === "PUBLIC") return true;

  const user = await getCurrentUser();
  if (user) return true; // l'admin voit tout

  if (bloc.visibilite === "PARTAGE") {
    const tokens = await getGuestTokens();
    if (tokens.length === 0) return false;
    const invite = await prisma.blocInvitation.findFirst({
      where: { blocId: bloc.id, token: { in: tokens } },
      select: { id: true },
    });
    return invite !== null;
  }

  return false; // PRIVE sans admin
}

/** Charge un bloc par slug et évalue l'accès en lecture en une passe. */
export async function loadReadableBloc(
  slug: string,
): Promise<{ bloc: Bloc | null; allowed: boolean }> {
  const bloc = await prisma.bloc.findUnique({ where: { slug } });
  if (!bloc) return { bloc: null, allowed: false };
  return { bloc, allowed: await canReadBloc(bloc) };
}
