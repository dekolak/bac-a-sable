"use client";

import { useActionState, useState } from "react";
import {
  updateBlocSettings,
  deleteBloc,
  type FormState,
} from "../actions";
import { PALETTE, groupeColor } from "@/lib/group-color";

type BlocSettings = {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  groupe: string | null;
  visibilite: "PUBLIC" | "PRIVE" | "PARTAGE";
  statut: "BROUILLON" | "TEST" | "PROD";
};

const initial: FormState = {};
const inputCls =
  "w-full rounded-md border border-border bg-panel px-3 py-2 outline-none focus:border-accent";

const NOUVEAU = "__nouveau__";

export function ReglagesPanel({
  bloc,
  groupesExistants,
  couleurGroupe,
}: {
  bloc: BlocSettings;
  groupesExistants: string[];
  couleurGroupe: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateBlocSettings, initial);

  // ── Groupe : liste déroulante des groupes existants + « nouveau groupe » ──
  const groupeInitial = bloc.groupe?.trim() ?? "";
  const dejaConnu = groupeInitial === "" || groupesExistants.includes(groupeInitial);
  const [sel, setSel] = useState<string>(dejaConnu ? groupeInitial : NOUVEAU);
  const [nouveau, setNouveau] = useState<string>(dejaConnu ? "" : groupeInitial);
  const groupeEffectif = (sel === NOUVEAU ? nouveau : sel).trim();

  // ── Couleur du groupe : auto (défaut) ou couleur explicite ──
  // `auto` = pas d'override → couleur dérivée du nom. Une couleur explicite
  // s'applique à tout le groupe. On envoie "auto" pour un reset explicite,
  // un hex pour poser une couleur, "" (chaîne vide) pour ne rien changer.
  const [auto, setAuto] = useState<boolean>(couleurGroupe === null);
  const [couleur, setCouleur] = useState<string>(
    couleurGroupe ?? (groupeEffectif ? groupeColor(groupeEffectif) : PALETTE[0]),
  );
  const apercu = auto
    ? groupeEffectif
      ? groupeColor(groupeEffectif)
      : "#6b7683"
    : couleur;
  // Valeur soumise : hex si couleur choisie, "auto" si reset, "" si inchangé.
  const couleurSoumise = !groupeEffectif
    ? ""
    : auto
      ? couleurGroupe === null
        ? "" // déjà en auto : ne rien changer
        : "auto" // était surchargé → reset explicite
      : couleur;

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
        <div>
          <label htmlFor="groupe-sel" className="mb-1 block text-sm text-muted">
            Groupe / Projet (optionnel)
          </label>
          {/* La vraie valeur envoyée au serveur (nom effectif du groupe). */}
          <input type="hidden" name="groupe" value={groupeEffectif} />
          <select
            id="groupe-sel"
            value={sel}
            onChange={(e) => setSel(e.target.value)}
            className={inputCls}
          >
            <option value="">Sans groupe</option>
            {groupesExistants.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
            <option value={NOUVEAU}>＋ Nouveau groupe…</option>
          </select>
          {sel === NOUVEAU && (
            <input
              autoFocus
              name="nouveau-groupe"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              placeholder="Nom du nouveau groupe (ex. Kiavik)"
              maxLength={80}
              className={`${inputCls} mt-2`}
            />
          )}
          <p className="mt-1 text-xs text-muted">
            Les blocs d'un même groupe sont rassemblés sur l'accueil. Donne le
            même nom à ceux qui travaillent ensemble.
          </p>
        </div>

        {/* Couleur du groupe — n'a de sens que si un groupe est défini. */}
        {groupeEffectif && (
          <div>
            <label className="mb-1 block text-sm text-muted">
              Couleur du groupe
            </label>
            <input type="hidden" name="couleurGroupe" value={couleurSoumise} />
            <div className="flex flex-wrap items-center gap-2">
              {/* Pastille d'aperçu (couleur effective actuelle). */}
              <span
                className="inline-block h-5 w-5 shrink-0 rounded-full ring-1 ring-white/20"
                style={{ background: apercu }}
                aria-hidden
              />
              {/* Choix « Auto » (couleur dérivée du nom). */}
              <button
                type="button"
                onClick={() => setAuto(true)}
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  auto
                    ? "border-accent text-white"
                    : "border-border text-muted hover:text-white"
                }`}
              >
                Auto
              </button>
              {/* Palette. */}
              {PALETTE.map((c) => {
                const actif = !auto && couleur.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => {
                      setAuto(false);
                      setCouleur(c);
                    }}
                    className={`h-6 w-6 rounded-full ring-2 transition ${
                      actif ? "ring-white" : "ring-transparent hover:ring-white/40"
                    }`}
                    style={{ background: c }}
                    aria-label={`Couleur ${c}`}
                  />
                );
              })}
              {/* Couleur personnalisée. */}
              <label
                className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted"
                title="Couleur personnalisée"
              >
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(couleur) ? couleur : "#4fa8e0"}
                  onChange={(e) => {
                    setAuto(false);
                    setCouleur(e.target.value);
                  }}
                  className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                />
                Perso
              </label>
            </div>
            <p className="mt-1 text-xs text-muted">
              S'applique à <strong>tout le groupe « {groupeEffectif} »</strong>.
              « Auto » = couleur dérivée automatiquement du nom.
            </p>
          </div>
        )}
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
