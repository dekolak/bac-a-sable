"use client";

import { useActionState, useState } from "react";
import { inviteAmi, revoquerInvitation, type FormState } from "../actions";

type Invitation = {
  id: string;
  email: string;
  token: string;
  acceptedAt: Date | null;
};

type BlocLite = {
  id: string;
  slug: string;
  visibilite: "PUBLIC" | "PRIVE" | "PARTAGE";
};

const initial: FormState = {};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="text-xs text-accent hover:underline"
        >
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
      <pre className="code-area overflow-x-auto rounded-md border border-border bg-panel p-3 text-xs">
        {value}
      </pre>
    </div>
  );
}

export function PartagePanel({
  bloc,
  invitations,
  appUrl,
}: {
  bloc: BlocLite;
  invitations: Invitation[];
  appUrl: string;
}) {
  const [state, formAction, pending] = useActionState(inviteAmi, initial);
  const base = appUrl || "";
  const snippet = `<div id="bloc-${bloc.slug}"></div>\n<script src="${base}/outils/${bloc.slug}/embed.js" data-cible="#bloc-${bloc.slug}"></script>`;
  const dataApi = `${base}/api/outils/${bloc.slug}/donnees`;

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-muted">
        La visibilité se règle dans l'onglet <strong>Réglages</strong>. Statut actuel :{" "}
        <strong className="text-white">{bloc.visibilite}</strong>.
      </p>

      {bloc.visibilite === "PUBLIC" && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium">Intégration sur un site externe</h2>
          <CopyField label="Snippet à coller (iframe auto)" value={snippet} />
          <CopyField label="API lecture seule (JSON des données)" value={dataApi} />
          <p className="text-xs text-muted">
            Le site client ne fait que lire. Toute mise à jour se fait ici, depuis la plateforme.
          </p>
        </section>
      )}

      {bloc.visibilite === "PARTAGE" && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium">Amis invités</h2>
          {invitations.length > 0 && (
            <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
              {invitations.map((inv) => (
                <li key={inv.id} className="flex items-center gap-2 bg-panel px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{inv.email}</div>
                    <div className="truncate font-mono text-xs text-muted">
                      {base}/p/{inv.token}
                    </div>
                  </div>
                  <span className="text-xs text-muted">
                    {inv.acceptedAt ? "actif" : "en attente"}
                  </span>
                  <form action={revoquerInvitation}>
                    <input type="hidden" name="id" value={inv.id} />
                    <input type="hidden" name="slug" value={bloc.slug} />
                    <button type="submit" className="text-xs text-red-400 hover:underline">
                      Révoquer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form action={formAction} className="flex items-end gap-2">
            <input type="hidden" name="blocId" value={bloc.id} />
            <div className="flex-1">
              <label htmlFor="email" className="mb-1 block text-sm text-muted">
                Inviter par email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-border bg-panel px-3 py-2 outline-none focus:border-accent"
                placeholder="ami@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-accent px-4 py-2 font-medium text-black disabled:opacity-60"
            >
              Inviter
            </button>
          </form>
          {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        </section>
      )}

      {bloc.visibilite === "PRIVE" && (
        <p className="rounded-md border border-border bg-panel p-4 text-sm text-muted">
          Ce bloc est privé : toi seul y as accès. Passe-le en Public (embarquable) ou Partagé
          (invitations) dans les Réglages.
        </p>
      )}
    </div>
  );
}
