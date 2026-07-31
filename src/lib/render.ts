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
 */
export function buildBlocDocument(bloc: Bloc, donnees: BlocDonnee[]): string {
  const data: Record<string, unknown> = {};
  for (const d of donnees) data[d.cle] = d.valeur;

  // Sérialisation sûre pour insertion dans une balise <script>.
  const dataJson = JSON.stringify(data).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(bloc.nom)}</title>
<style>html,body{margin:0;font-family:system-ui,sans-serif}</style>
<script>
  window.BLOC = (function () {
    var data = ${dataJson};
    return {
      slug: ${JSON.stringify(bloc.slug)},
      data: data,
      get: function (cle) { return data[cle]; },
      keys: function () { return Object.keys(data); }
    };
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
