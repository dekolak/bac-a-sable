import { notFound } from "next/navigation";
import { loadReadableBloc } from "@/lib/access";

export const dynamic = "force-dynamic";

// Vue humaine plein écran d'un bloc. Le code s'exécute dans une iframe
// sandbox (isolation) pointant sur la route /embed.
export default async function OutilPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { bloc, allowed } = await loadReadableBloc(slug);
  if (!bloc || !allowed) notFound();

  return (
    <iframe
      src={`/outils/${slug}/embed`}
      sandbox="allow-scripts allow-forms allow-popups"
      title={bloc.nom}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0 }}
    />
  );
}
