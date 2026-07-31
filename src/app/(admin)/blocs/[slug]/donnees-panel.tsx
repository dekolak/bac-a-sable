"use client";

import { useActionState, useState } from "react";
import {
  upsertBlocDonnee,
  deleteBlocDonnee,
  type FormState,
} from "../actions";

type Donnee = {
  id: string;
  cle: string;
  valeur: unknown;
  updatedAt: Date;
};

const initial: FormState = {};

function preview(valeur: unknown): string {
  const s = typeof valeur === "string" ? valeur : JSON.stringify(valeur);
  return s.length > 80 ? s.slice(0, 80) + "…" : s;
}

export function DonneesPanel({
  blocId,
  slug,
  donnees,
}: {
  blocId: string;
  slug: string;
  donnees: Donnee[];
}) {
  const [state, formAction, pending] = useActionState(upsertBlocDonnee, initial);
  const [cle, setCle] = useState("");
  const [valeur, setValeur] = useState("");

  function edit(d: Donnee) {
    setCle(d.cle);
    setValeur(
      typeof d.valeur === "string" ? d.valeur : JSON.stringify(d.valeur, null, 2),
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="mb-2 text-sm font-medium text-muted">Clés stockées</h2>
        {donnees.length === 0 ? (
          <p className="rounded-md border border-border bg-panel p-4 text-sm text-muted">
            Aucune donnée. Ajoute une première clé.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
            {donnees.map((d) => (
              <li key={d.id} className="flex items-center gap-2 bg-panel px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm">{d.cle}</div>
                  <div className="truncate font-mono text-xs text-muted">{preview(d.valeur)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => edit(d)}
                  className="text-xs text-accent hover:underline"
                >
                  Éditer
                </button>
                <form action={deleteBlocDonnee}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <button type="submit" className="text-xs text-red-400 hover:underline">
                    Suppr.
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="blocId" value={blocId} />
        <h2 className="text-sm font-medium text-muted">Ajouter / modifier une clé</h2>
        <div>
          <label htmlFor="cle" className="mb-1 block text-sm text-muted">
            Clé
          </label>
          <input
            id="cle"
            name="cle"
            value={cle}
            onChange={(e) => setCle(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-panel px-3 py-2 font-mono outline-none focus:border-accent"
            placeholder="guide"
          />
        </div>
        <div>
          <label htmlFor="valeur" className="mb-1 block text-sm text-muted">
            Valeur (JSON)
          </label>
          <textarea
            id="valeur"
            name="valeur"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            className="code-area h-56 w-full resize-y rounded-md border border-border bg-panel p-3 outline-none focus:border-accent"
            placeholder='{ "titre": "…", "bulles": [] }'
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-accent px-4 py-2 font-medium text-black disabled:opacity-60"
          >
            {pending ? "Enregistrement…" : "Enregistrer la clé"}
          </button>
          {state.error && <span className="text-sm text-red-400">{state.error}</span>}
        </div>
      </form>
    </div>
  );
}
