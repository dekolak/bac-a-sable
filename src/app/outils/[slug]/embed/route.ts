import { prisma } from "@/lib/prisma";
import { canReadBloc } from "@/lib/access";
import { buildBlocDocument } from "@/lib/render";
import { NO_CACHE_HEADERS } from "@/lib/no-cache";

export const dynamic = "force-dynamic";

// Renvoie le document HTML autonome du bloc, destiné à être chargé dans
// une iframe (aperçu admin ou intégration externe). Accès selon la
// visibilité du bloc.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const bloc = await prisma.bloc.findUnique({ where: { slug } });
  if (!bloc || !(await canReadBloc(bloc))) {
    return new Response("Bloc introuvable ou accès refusé.", { status: 404 });
  }

  const donnees = await prisma.blocDonnee.findMany({ where: { blocId: bloc.id } });
  const html = buildBlocDocument(bloc, donnees);

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...NO_CACHE_HEADERS,
    },
  });
}
