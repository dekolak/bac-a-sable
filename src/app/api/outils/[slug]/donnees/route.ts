import { prisma } from "@/lib/prisma";
import { canReadBloc } from "@/lib/access";
import { NO_CACHE_HEADERS } from "@/lib/no-cache";

export const dynamic = "force-dynamic";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  ...NO_CACHE_HEADERS,
};

// API publique EN LECTURE SEULE des données d'un bloc.
// C'est ce qu'un site client externe interroge. Aucune écriture ici :
// toute mise à jour passe par la plateforme (routes admin).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const bloc = await prisma.bloc.findUnique({ where: { slug } });
  if (!bloc || !(await canReadBloc(bloc))) {
    return Response.json({ error: "introuvable" }, { status: 404, headers: CORS });
  }

  const donnees = await prisma.blocDonnee.findMany({
    where: { blocId: bloc.id },
    orderBy: { cle: "asc" },
  });
  const data = Object.fromEntries(donnees.map((d) => [d.cle, d.valeur]));

  return Response.json({ slug: bloc.slug, data }, { headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
