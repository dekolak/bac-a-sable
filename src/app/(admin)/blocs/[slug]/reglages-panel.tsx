"use client";

import { useActionState } from "react";
import {
  updateBlocSettings,
  deleteBloc,
  type FormState,
} from "../actions";

type BlocSettings = {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  visibilite: "PUBLIC" | "PRIVE" | "PARTAGE";
  statut: "BROUILLON" | "TEST" | "PROD";
};

const initial: FormState = {};
const inputCls =
  "w-full rounded-md border border-border bg-panel px-3 py-2 outline-none focus:border-accent";

export function ReglagesPanel({ bloc }: { bloc: BlocSettings }) {
  const [state, formAction, pending] = useActionState(updateBlocSettings, initial);

  return (
    <div className="max-w-lg space-y-8">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={bloc.id} />
        <div>
          <label htmlFor="nom" className="mb-1 block text-sm text-muted">
            Nom
          </label>
          <input id="nom" name="nom" defaultValue={bloc.nom} required className={inputCls} />
        </div>
        <div>
          <label htmlFor="slug" className="mb-1 block text-sm text-muted">
            Slug
          </label>
          <input id="slug" name="slug" defaultValue={bloc.slug} required className={inputCls} />
          <p className="mt-1 text-xs text-muted">
            Changer le slug change l'URL publique et casse les intégrations existantes.
          </p>
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-sm text-muted">
            Description (optionnelle)
          </label>
          <input
            id="description"
            name="description"
            defaultValue={bloc.description ?? ""}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="visibilite" className="mb-1 block text-sm text-muted">
              Visibilité
            </label>
            <select
              id="visibilite"
              name="visibilite"
              defaultValue={bloc.visibilite}
              className={inputCls}
            >
              <option value="PRIVE">Privé</option>
              <option value="PUBLIC">Public</option>
              <option value="PARTAGE">Partagé</option>
            </select>
          </div>
          <div>
            <label htmlFor="statut" className="mb-1 block text-sm text-muted">
              Statut
            </label>
            <select id="statut" name="statut" defaultValue={bloc.statut} className={inputCls}>
              <option value="BROUILLON">Brouillon</option>
              <option value="TEST">Test</option>
              <option value="PROD">Prod</option>
            </select>
          </div>
        </div>

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 font-medium text-black disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <form
        action={deleteBloc}
        className="rounded-md border border-red-500/30 bg-red-500/5 p-4"
      >
        <input type="hidden" name="id" value={bloc.id} />
        <h2 className="mb-1 text-sm font-medium text-red-300">Zone dangereuse</h2>
        <p className="mb-3 text-xs text-muted">
          Supprime le bloc, ses données et ses invitations. Irréversible.
        </p>
        <button type="submit" className="rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10">
          Supprimer ce bloc
        </button>
      </form>
    </div>
  );
}
