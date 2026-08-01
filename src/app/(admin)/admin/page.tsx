import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VisibiliteBadge, StatutBadge } from "@/components/badges";
import { groupeColor } from "@/lib/group-color";

export const dynamic = "force-dynamic";

const SANS_GROUPE = "";

export default async function DashboardPage() {
  const blocs = await prisma.bloc.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { donnees: true } } },
  });

  // Regroupement par « groupe » (les blocs sans groupe finissent ensemble).
  const groupes = new Map<string, typeof blocs>();
  for (const bloc of blocs) {
    const cle = bloc.groupe?.trim() || SANS_GROUPE;
    (groupes.get(cle) ?? groupes.set(cle, []).get(cle)!).push(bloc);
  }
  // Groupes nommés en ordre alpha, « Sans groupe » en dernier.
  const cles = [...groupes.keys()].sort((a, b) => {
    if (a === SANS_GROUPE) return 1;
    if (b === SANS_GROUPE) return -1;
    return a.localeCompare(b, "fr");
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
        <div className="space-y-6">
          {cles.map((cle) => {
            const liste = groupes.get(cle)!;
            const nomme = cle !== SANS_GROUPE;
            const couleur = nomme ? groupeColor(cle) : "#6b7683";
            return (
              <section key={cle || "__sans__"}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: couleur }}
                    aria-hidden
                  />
                  <span className={nomme ? "" : "text-muted"}>
                    {nomme ? cle : "Sans groupe"}
                  </span>
                  <span className="text-xs font-normal text-muted">({liste.length})</span>
                </h2>
                <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
                  {liste.map((bloc) => (
                    <li key={bloc.id} className="bg-panel">
                      <Link
                        href={`/blocs/${bloc.slug}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-2 w-2 shrink-0 rounded-full"
                              style={{ background: couleur }}
                              aria-hidden
                            />
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
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
