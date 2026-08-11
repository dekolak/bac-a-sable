"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { COULEURS, EMOJIS } from "@/lib/lanceur";
import { saveRaccourci, deleteRaccourci } from "./actions";

type Raccourci = {
  id: string;
  nom: string;
  url: string;
  icone: string;
  couleur: string;
};

const clamp2: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  wordBreak: "break-word",
};

function initiale(nom: string): string {
  return (nom.trim().charAt(0) || "?").toUpperCase();
}

export function LanceurClient({ raccourcis }: { raccourcis: Raccourci[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [ouvert, setOuvert] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");

  // Champs contrôlés (nécessaire pour l'aperçu en direct + pickers custom).
  const [nom, setNom] = useState("");
  const [url, setUrl] = useState("");
  const [icone, setIcone] = useState("");
  const [couleur, setCouleur] = useState(COULEURS[0]);
  const nomRef = useRef<HTMLInputElement>(null);

  function ouvrir(r: Raccourci | null) {
    setEditId(r?.id ?? null);
    setNom(r?.nom ?? "");
    setUrl(r?.url ?? "");
    setIcone(r?.icone ?? "");
    setCouleur(r?.couleur && /^#[0-9a-fA-F]{6}$/.test(r.couleur) ? r.couleur : COULEURS[0]);
    setErreur("");
    setOuvert(true);
    setTimeout(() => nomRef.current?.focus(), 30);
  }
  function fermer() {
    setOuvert(false);
  }

  function enregistrer() {
    const fd = new FormData();
    if (editId) fd.set("id", editId);
    fd.set("nom", nom);
    fd.set("url", url);
    fd.set("icone", icone);
    fd.set("couleur", couleur);
    start(async () => {
      const res = await saveRaccourci({}, fd);
      if (res.error) setErreur(res.error);
      else {
        fermer();
        router.refresh();
      }
    });
  }

  function supprimer() {
    if (!editId) return;
    if (!confirm("Supprimer cet outil ?")) return;
    const fd = new FormData();
    fd.set("id", editId);
    start(async () => {
      await deleteRaccourci(fd);
      fermer();
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-5">
        <button
          type="button"
          onClick={() => ouvrir(null)}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-black"
        >
          ＋ Ajouter un outil
        </button>
      </div>

      <div
        className="grid gap-x-3 gap-y-5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))" }}
      >
        {raccourcis.map((r) => (
          <div key={r.id} className="group relative text-center">
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2"
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl leading-none text-white shadow-lg"
                style={{ background: r.couleur }}
              >
                {r.icone.trim() ? (
                  r.icone
                ) : (
                  <span className="text-2xl font-bold">{initiale(r.nom)}</span>
                )}
              </span>
              <span className="max-w-[88px] text-xs leading-tight" style={clamp2}>
                {r.nom}
              </span>
            </a>
            <button
              type="button"
              onClick={() => ouvrir(r)}
              title="Modifier"
              className="absolute -top-1.5 right-1 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-panel text-xs text-muted group-hover:flex"
            >
              ✎
            </button>
          </div>
        ))}

        {/* Tuile « Ajouter » */}
        <button
          type="button"
          onClick={() => ouvrir(null)}
          className="flex flex-col items-center gap-2"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-border text-3xl text-muted">
            ＋
          </span>
          <span className="text-xs text-muted">Ajouter</span>
        </button>
      </div>

      {raccourcis.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          Aucun outil pour l'instant. Clique sur « Ajouter un outil ».
        </p>
      )}

      {/* Modale d'édition */}
      {ouvert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) fermer();
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-panel p-5">
            <h2 className="mb-4 text-base font-semibold">
              {editId ? "Modifier l'outil" : "Nouvel outil"}
            </h2>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted">Nom</label>
                <input
                  ref={nomRef}
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  maxLength={40}
                  placeholder="Ex. Facturation"
                  className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col items-center">
                <label className="mb-1 block text-xs text-muted">Aperçu</label>
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl leading-none text-white shadow"
                  style={{ background: couleur }}
                >
                  {icone.trim() ? icone : <span className="text-lg font-bold">{initiale(nom)}</span>}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs text-muted">URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemple.com"
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs text-muted">Icône (un emoji)</label>
              <input
                value={icone}
                onChange={(e) => setIcone(e.target.value)}
                maxLength={16}
                placeholder="🔧"
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border bg-bg p-2">
                {EMOJIS.map((cat) => (
                  <div key={cat.titre} className="mb-2 last:mb-0">
                    <div className="mb-1 text-[11px] uppercase tracking-wide text-muted">
                      {cat.titre}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cat.liste.map((e, i) => (
                        <button
                          key={cat.titre + i}
                          type="button"
                          onClick={() => setIcone(e)}
                          className="rounded px-1.5 py-1 text-lg hover:bg-white/10"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Tu peux aussi coller n'importe quel emoji. Vide → l'initiale du nom.
              </p>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs text-muted">Couleur</label>
              <div className="flex flex-wrap items-center gap-2">
                {COULEURS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCouleur(c)}
                    aria-label={`Couleur ${c}`}
                    className={`h-6 w-6 rounded-full ring-2 transition ${
                      couleur.toLowerCase() === c.toLowerCase()
                        ? "ring-white"
                        : "ring-transparent hover:ring-white/40"
                    }`}
                    style={{ background: c }}
                  />
                ))}
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(couleur) ? couleur : "#2f6fed"}
                  onChange={(e) => setCouleur(e.target.value)}
                  title="Couleur personnalisée"
                  className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
                />
              </div>
            </div>

            {erreur && <p className="mt-3 text-sm text-red-400">{erreur}</p>}

            <div className="mt-5 flex items-center gap-2">
              {editId && (
                <button
                  type="button"
                  onClick={supprimer}
                  disabled={pending}
                  className="rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                >
                  Supprimer
                </button>
              )}
              <span className="flex-1" />
              <button
                type="button"
                onClick={fermer}
                disabled={pending}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-white disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={enregistrer}
                disabled={pending}
                className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-black disabled:opacity-60"
              >
                {pending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
