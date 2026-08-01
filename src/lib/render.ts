import "server-only";
import type { Bloc, BlocDonnee } from "@prisma/client";

/**
 * Construit le document HTML autonome d'un bloc : un petit runtime
 * `window.BLOC` (données injectées en lecture) suivi du code collé.
 *
 * Les données sont sérialisées côté serveur : chaque chargement de
 * l'iframe repart de la version à jour en base — c'est ce qui fait que
 * l'intégration externe « affiche toujours le contenu à jour » sans que
 * le site client n'ait à se reconnecter.
 *
 * `writable` (surface d'édition admin uniquement) ajoute au shim
 * `window.BLOC.set(cle, valeur)` et `window.BLOC.save({…})`, qui écrivent
 * via l'endpoint admin `PUT /api/blocs/<slug>/donnees` (authentifié par la
 * session, requête same-origin). L'embed public reste en lecture seule.
 */
export function buildBlocDocument(
  bloc: Bloc,
  donnees: BlocDonnee[],
  options: { writable?: boolean } = {},
): string {
  const data: Record<string, unknown> = {};
  for (const d of donnees) data[d.cle] = d.valeur;

  // Sérialisation sûre pour insertion dans une balise <script>.
  const dataJson = JSON.stringify(data).replace(/</g, "\\u003c");
  const slugJson = JSON.stringify(bloc.slug);

  const writeScript = options.writable
    ? `
    api.canWrite = true;
    // Écrit plusieurs clés d'un coup (fusion, ne supprime rien).
    api.save = function (obj) {
      return fetch("/api/blocs/" + encodeURIComponent(slug) + "/donnees", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(obj)
      }).then(function (r) {
        if (!r.ok) throw new Error("écriture refusée (" + r.status + ")");
        return r.json();
      }).then(function (res) {
        if (res && res.data) { data = res.data; api.data = data; }
        return res;
      });
    };
    // Écrit une seule clé.
    api.set = function (cle, valeur) { var o = {}; o[cle] = valeur; return api.save(o); };`
    : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(bloc.nom)}</title>
<style>
  html,body{margin:0;font-family:system-ui,sans-serif}
  /* Médias responsives par défaut : évite le débordement horizontal sur
     mobile quand un bloc affiche une image/vidéo plus large que l'écran.
     L'auto-resize ne gère que la hauteur ; sans ceci, une image large
     provoque un scroll horizontal dans l'iframe d'intégration. */
  img,video{max-width:100%;height:auto}
</style>
<script>
  window.BLOC = (function () {
    var slug = ${slugJson};
    var data = ${dataJson};
    var api = {
      slug: slug,
      data: data,
      get: function (cle) { return data[cle]; },
      keys: function () { return Object.keys(data); }
    };${writeScript}
    return api;
  })();
</script>
</head>
<body>
${bloc.code || ""}
<script>
  // Auto-redimensionnement : informe la page hôte de la hauteur réelle.
  (function () {
    function post() {
      try {
        var h = document.documentElement.scrollHeight;
        parent.postMessage({ type: "bloc:height", slug: window.BLOC.slug, height: h }, "*");
      } catch (e) {}
    }
    window.addEventListener("load", post);
    window.addEventListener("resize", post);
    setTimeout(post, 300);
  })();
</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
