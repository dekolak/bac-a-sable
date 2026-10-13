// Attributs de l'iframe qui HÉBERGE un bloc pour l'AFFICHAGE : vue publique
// plein écran (/outils/<slug>) et intégration externe (embed.js).
//
// Pourquoi `allow-same-origin` est SÛR ici : le bloc est servi depuis l'origine
// de la plateforme (ex. outils.dekolak.fr), DIFFÉRENTE de celle du site hôte
// (ex. le site Odoo qui colle le snippet). Le bloc n'obtient donc accès qu'à
// SA propre origine, jamais à celle du site hôte. On charge toujours une vraie
// URL (src=…), pas un srcdoc (un srcdoc + allow-same-origin hériterait de
// l'origine du site hôte — ce qu'on ne veut surtout pas).
//
// Sans `allow-same-origin`, l'iframe tourne en « origin null », ce qui :
//   - force les iframes tierces imbriquées (ex. lecteur Vimeo) en origin null
//     → leurs requêtes (challenge-platform, API) sont bloquées, lecteur KO ;
//   - casse le fetch du bloc vers son API same-origin ;
//   - rend localStorage inaccessible.
//
// NB : ceci ne concerne PAS l'aperçu d'édition admin (code-panel), qui reste
// volontairement isolé (allow-scripts seul) car il est, lui, same-origin que
// la session admin.
export const BLOC_FRAME_SANDBOX =
  "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms";

// Fonctionnalités déléguées à l'iframe (Permissions Policy) : lecture vidéo.
export const BLOC_FRAME_ALLOW = "autoplay; fullscreen; picture-in-picture";
