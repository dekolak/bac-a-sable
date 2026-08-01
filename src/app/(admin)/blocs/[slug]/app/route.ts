import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { buildBlocDocument } from "@/lib/render";
import { NO_CACHE_HEADERS } from "@/lib/no-cache";

export const dynamic = "force-dynamic";

// Surface d'ÉDITION du bloc, réservée à l'admin connecté. Le document est
// servi same-origin (pas d'iframe sandbox opaque) : le cookie de session
// circule, donc `window.BLOC.save()/set()` peut écrire via l'endpoint
// admin. C'est ici qu'un outil (ex. éditeur de guide) persiste son contenu
// à la place de localStorage. Le rendu PUBLIC (/outils/<slug>/embed) reste,
// lui, en lecture seule.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const bloc = await prisma.bloc.findUnique({ where: { slug } });
  if (!bloc) {
    return new Response("Bloc introuvable.", { status: 404 });
  }

  const donnees = await prisma.blocDonnee.findMany({ where: { blocId: bloc.id } });
  const html = buildBlocDocument(bloc, donnees, { writable: true });

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...NO_CACHE_HEADERS,
    },
  });
}
