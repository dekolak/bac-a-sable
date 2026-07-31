"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateBlocCode, type FormState } from "../actions";

const initial: FormState = {};

export function CodePanel({
  blocId,
  slug,
  code,
}: {
  blocId: string;
  slug: string;
  code: string;
}) {
  const [state, formAction, pending] = useActionState(updateBlocCode, initial);
  const [saved, setSaved] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Après un enregistrement réussi, on rafraîchit l'aperçu.
  useEffect(() => {
    if (!pending && !state.error) {
      setSaved(true);
      if (iframeRef.current) {
        // Recharge l'aperçu avec la version fraîchement enregistrée.
        iframeRef.current.src = `/outils/${slug}/embed?_=${Date.now()}`;
      }
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state, pending, slug]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={formAction} className="flex flex-col">
        <input type="hidden" name="id" value={blocId} />
        <label htmlFor="code" className="mb-1 block text-sm text-muted">
          Code HTML / JS du bloc
        </label>
        <textarea
          id="code"
          name="code"
          defaultValue={code}
          spellCheck={false}
          className="code-area h-[420px] w-full resize-y rounded-md border border-border bg-panel p-3 outline-none focus:border-accent"
          placeholder="<div>…</div>&#10;<script>/* window.BLOC.get('cle') pour lire les données */</script>"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-accent px-4 py-2 font-medium text-black disabled:opacity-60"
          >
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
          {saved && <span className="text-sm text-green-400">Enregistré ✓</span>}
          {state.error && <span className="text-sm text-red-400">{state.error}</span>}
        </div>
      </form>

      <div className="flex flex-col">
        <span className="mb-1 block text-sm text-muted">Aperçu (dernière version enregistrée)</span>
        <iframe
          ref={iframeRef}
          src={`/outils/${slug}/embed`}
          className="h-[420px] w-full rounded-md border border-border bg-white"
          sandbox="allow-scripts"
          title="Aperçu du bloc"
        />
      </div>
    </div>
  );
}
