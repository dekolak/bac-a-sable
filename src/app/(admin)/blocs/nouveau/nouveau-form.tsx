"use client";

import { useActionState } from "react";
import { createBloc, type FormState } from "../actions";

const initial: FormState = {};

const inputCls =
  "w-full rounded-md border border-border bg-panel px-3 py-2 outline-none focus:border-accent";

export function NouveauBlocForm() {
  const [state, formAction, pending] = useActionState(createBloc, initial);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div>
        <label htmlFor="nom" className="mb-1 block text-sm text-muted">
          Nom
        </label>
        <input id="nom" name="nom" required className={inputCls} placeholder="Mon calculateur" />
      </div>
      <div>
        <label htmlFor="slug" className="mb-1 block text-sm text-muted">
          Slug (optionnel — dérivé du nom sinon)
        </label>
        <input id="slug" name="slug" className={inputCls} placeholder="mon-calculateur" />
        <p className="mt-1 text-xs text-muted">URL publique : /outils/&lt;slug&gt;</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="visibilite" className="mb-1 block text-sm text-muted">
            Visibilité
          </label>
          <select id="visibilite" name="visibilite" defaultValue="PRIVE" className={inputCls}>
            <option value="PRIVE">Privé</option>
            <option value="PUBLIC">Public</option>
            <option value="PARTAGE">Partagé</option>
          </select>
        </div>
        <div>
          <label htmlFor="statut" className="mb-1 block text-sm text-muted">
            Statut
          </label>
          <select id="statut" name="statut" defaultValue="BROUILLON" className={inputCls}>
            <option value="BROUILLON">Brouillon</option>
            <option value="TEST">Test</option>
            <option value="PROD">Prod</option>
          </select>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 font-medium text-black disabled:opacity-60"
      >
        {pending ? "Création…" : "Créer le bloc"}
      </button>
    </form>
  );
}
