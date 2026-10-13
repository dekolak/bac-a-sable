import { notFound } from "next/navigation";
import { loadReadableBloc } from "@/lib/access";
import { BLOC_FRAME_SANDBOX, BLOC_FRAME_ALLOW } from "@/lib/embed-frame";

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
      sandbox={BLOC_FRAME_SANDBOX}
      allow={BLOC_FRAME_ALLOW}
      allowFullScreen
      title={bloc.nom}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0 }}
    />
  );
}
