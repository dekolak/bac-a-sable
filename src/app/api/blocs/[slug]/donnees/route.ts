import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Écriture des données d'un bloc — RÉSERVÉE À L'ADMIN connecté.
// C'est le pendant « écriture » de l'API publique read-only. Le corps est
// un objet clé→valeur ; chaque clé est upsertée (fusion, aucune clé n'est
// supprimée). Utilisé par `window.BLOC.save()/set()` sur la surface
// d'édition admin (requête same-origin, cookie de session).
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "non authentifié" }, { status: 401 });
  }

  // Garde CSRF légère : refuse une écriture d'origine croisée.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return Response.json({ error: "origine refusée" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "origine invalide" }, { status: 403 });
    }
  }

  const { slug } = await params;
  const bloc = await prisma.bloc.findUnique({ where: { slug } });
  if (!bloc) {
    return Response.json({ error: "introuvable" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "objet clé-valeur attendu" }, { status: 400 });
  }

  const entries = Object.entries(body as Record<string, unknown>);
  for (const [cle, valeur] of entries) {
    await prisma.blocDonnee.upsert({
      where: { blocId_cle: { blocId: bloc.id, cle } },
      create: { blocId: bloc.id, cle, valeur: valeur as never },
      update: { valeur: valeur as never },
    });
  }

  const donnees = await prisma.blocDonnee.findMany({
    where: { blocId: bloc.id },
    orderBy: { cle: "asc" },
  });
  const data = Object.fromEntries(donnees.map((d) => [d.cle, d.valeur]));

  // Les vues admin et le rendu public reflètent aussitôt la mise à jour.
  revalidatePath(`/blocs/${slug}`);
  revalidatePath(`/outils/${slug}`);

  return Response.json({ slug: bloc.slug, data });
}
