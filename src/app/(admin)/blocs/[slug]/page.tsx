import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/app-url";
import { VisibiliteBadge, StatutBadge } from "@/components/badges";
import { CodePanel } from "./code-panel";
import { DonneesPanel } from "./donnees-panel";
import { PartagePanel } from "./partage-panel";
import { ReglagesPanel } from "./reglages-panel";

export const dynamic = "force-dynamic";

type Onglet = "code" | "donnees" | "partage" | "reglages";
const ONGLETS: { key: Onglet; label: string }[] = [
  { key: "code", label: "Code" },
  { key: "donnees", label: "Données" },
  { key: "partage", label: "Partage" },
  { key: "reglages", label: "Réglages" },
];

export default async function BlocEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  const { slug } = await params;
  const { onglet: rawOnglet } = await searchParams;
  const onglet = (ONGLETS.find((o) => o.key === rawOnglet)?.key ?? "code") as Onglet;

  const bloc = await prisma.bloc.findUnique({
    where: { slug },
    include: {
      donnees: { orderBy: { cle: "asc" } },
      invitations: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!bloc) notFound();

  const appUrl = await getAppUrl();

  // Liens éditeur ↔ visionneuse, déduits de la clé de données « source »
  // (une visionneuse porte source = slug de son éditeur).
  const sourceDonnee = bloc.donnees.find((d) => d.cle === "source");
  const sourceSlug =
    typeof sourceDonnee?.valeur === "string" ? sourceDonnee.valeur.trim() : null;
  const editeurLie =
    sourceSlug && sourceSlug !== bloc.slug
      ? await prisma.bloc.findUnique({
          where: { slug: sourceSlug },
          select: { slug: true, nom: true },
        })
      : null;

  const visionneusesLiees = (
    await prisma.blocDonnee.findMany({
      where: { cle: "source", valeur: { equals: bloc.slug } },
      select: { bloc: { select: { slug: true, nom: true } } },
    })
  )
    .map((d) => d.bloc)
    .filter((v) => v.slug !== bloc.slug);

  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-white">
        ← Tous les blocs
      </Link>

      <div className="mb-4 mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">{bloc.nom}</h1>
        <VisibiliteBadge value={bloc.visibilite} />
        <StatutBadge value={bloc.statut} />
        <a
          href={`/blocs/${bloc.slug}/app`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-sm text-accent hover:underline"
          title="Surface d'édition : le bloc tourne connecté et peut écrire ses données"
        >
          Ouvrir l'éditeur ↗
        </a>
        <a
          href={`/outils/${bloc.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-accent hover:underline"
        >
          Vue publique ↗
        </a>
      </div>

      {(editeurLie || visionneusesLiees.length > 0) && (
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
          {editeurLie && (
            <span>
              Éditeur lié :{" "}
              <Link
                href={`/blocs/${editeurLie.slug}`}
                className="text-accent hover:underline"
              >
                {editeurLie.nom} →
              </Link>
            </span>
          )}
          {visionneusesLiees.length > 0 && (
            <span>
              Visionneuse{visionneusesLiees.length > 1 ? "s" : ""} liée
              {visionneusesLiees.length > 1 ? "s" : ""} :{" "}
              {visionneusesLiees.map((v, i) => (
                <span key={v.slug}>
                  {i > 0 && ", "}
                  <Link
                    href={`/blocs/${v.slug}`}
                    className="text-accent hover:underline"
                  >
                    {v.nom} →
                  </Link>
                </span>
              ))}
            </span>
          )}
        </div>
      )}

      <nav className="mb-6 flex gap-1 border-b border-border">
        {ONGLETS.map((o) => (
          <Link
            key={o.key}
            href={`/blocs/${bloc.slug}?onglet=${o.key}`}
            className={`px-3 py-2 text-sm ${
              o.key === onglet
                ? "border-b-2 border-accent text-white"
                : "text-muted hover:text-white"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </nav>

      {onglet === "code" && <CodePanel blocId={bloc.id} slug={bloc.slug} code={bloc.code} />}
      {onglet === "donnees" && (
        <DonneesPanel blocId={bloc.id} slug={bloc.slug} donnees={bloc.donnees} />
      )}
      {onglet === "partage" && (
        <PartagePanel bloc={bloc} invitations={bloc.invitations} appUrl={appUrl} />
      )}
      {onglet === "reglages" && <ReglagesPanel bloc={bloc} />}
    </div>
  );
}
