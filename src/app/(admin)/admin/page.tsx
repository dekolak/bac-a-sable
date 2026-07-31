import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VisibiliteBadge, StatutBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const blocs = await prisma.bloc.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { donnees: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Mes blocs</h1>
        <Link
          href="/blocs/nouveau"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-black"
        >
          + Nouveau bloc
        </Link>
      </div>

      {blocs.length === 0 ? (
        <p className="rounded-md border border-border bg-panel p-6 text-sm text-muted">
          Aucun bloc pour l'instant. Crée ton premier outil.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {blocs.map((bloc) => (
            <li key={bloc.id} className="bg-panel">
              <Link
                href={`/blocs/${bloc.slug}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{bloc.nom}</span>
                    <VisibiliteBadge value={bloc.visibilite} />
                    <StatutBadge value={bloc.statut} />
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted">
                    /outils/{bloc.slug} · {bloc._count.donnees} clé(s)
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {bloc.updatedAt.toLocaleDateString("fr-FR")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
