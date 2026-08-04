"use client";

import { useEffect, useState } from "react";

// Clé de persistance : la liste des groupes REPLIÉS, mémorisée dans le
// navigateur (pas de base à toucher). Un seul admin, un dashboard → localStorage
// est le bon niveau : l'état de pliage suit le poste, pas le compte.
const STORE = "bas:groupes-replies";

function lireReplies(): Set<string> {
  try {
    const raw = localStorage.getItem(STORE);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function ecrireReplies(set: Set<string>) {
  try {
    localStorage.setItem(STORE, JSON.stringify([...set]));
  } catch {
    /* quota / mode privé : on ignore, le pliage reste juste non persistant */
  }
}

/**
 * Section de groupe repliable sur l'accueil. L'en-tête (pastille + nom + compte)
 * devient un bouton qui ouvre/ferme la liste. La liste elle-même reste rendue
 * côté serveur et passée en `children` (badges intacts).
 *
 * Rendu initial toujours OUVERT (comme le serveur) pour éviter tout écart
 * d'hydratation ; l'état replié mémorisé est appliqué juste après le montage.
 */
export function GroupeSection({
  groupeKey,
  titre,
  couleur,
  count,
  nomme,
  children,
}: {
  groupeKey: string;
  titre: string;
  couleur: string;
  count: number;
  nomme: boolean;
  children: React.ReactNode;
}) {
  const [ouvert, setOuvert] = useState(true);

  useEffect(() => {
    if (lireReplies().has(groupeKey)) setOuvert(false);
  }, [groupeKey]);

  function basculer() {
    setOuvert((prec) => {
      const suivant = !prec;
      const set = lireReplies();
      if (suivant) set.delete(groupeKey);
      else set.add(groupeKey);
      ecrireReplies(set);
      return suivant;
    });
  }

  const listeId = `grp-${groupeKey}`;

  return (
    <section>
      <button
        type="button"
        onClick={basculer}
        aria-expanded={ouvert}
        aria-controls={listeId}
        className="mb-2 flex w-full items-center gap-2 text-sm font-medium"
      >
        {/* Chevron : pivote selon l'état ouvert/replié. */}
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3 shrink-0 text-muted transition-transform"
          style={{ transform: ouvert ? "rotate(90deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: couleur }}
          aria-hidden
        />
        <span className={nomme ? "" : "text-muted"}>{titre}</span>
        <span className="text-xs font-normal text-muted">({count})</span>
      </button>
      <div id={listeId} hidden={!ouvert}>
        {children}
      </div>
    </section>
  );
}
