# API d'un bloc (`window.BLOC`) et endpoints de données

Référence pour écrire le code d'un bloc (outil collé) et pour lire ses
données depuis l'extérieur.

## `window.BLOC` — injecté dans tout rendu de bloc

Disponible **avant** ton code, sans rien à charger :

```js
window.BLOC.slug            // string — le slug du bloc lui-même
window.BLOC.data            // objet { cle: valeur, ... } (déjà parsé)
window.BLOC.get("cle")      // la valeur d'une clé (ou undefined)
window.BLOC.keys()          // ["cle1", "cle2", ...]
```

Ces méthodes sont **synchrones** : les données sont injectées côté serveur
à chaque chargement, donc toujours à jour, sans requête réseau.

### Écriture — uniquement sur la surface d'édition admin

Quand le bloc est ouvert via **`/blocs/<slug>/app`** (admin connecté), le
shim gagne en plus :

```js
window.BLOC.canWrite        // true sur cette surface
await window.BLOC.set("cle", valeur)   // écrit une clé
await window.BLOC.save({ cle1: v1, cle2: v2 })  // écrit plusieurs clés (fusion)
```

`set`/`save` renvoient une Promise résolue avec `{ slug, data }` (l'état à
jour) et rafraîchissent `window.BLOC.data`. La fusion n'efface **aucune**
clé non mentionnée. Ces méthodes **n'existent pas** dans le rendu public
(`/outils/<slug>/embed`), qui reste en lecture seule.

## Endpoints

| Méthode & route | Accès | Rôle |
|---|---|---|
| `GET /api/outils/<slug>/donnees` | **public** (CORS `*`) | Lecture seule : `{ slug, data }`. |
| `PUT /api/blocs/<slug>/donnees` | **admin** (session, same-origin) | Écriture : corps = objet clé→valeur, upsert (fusion). |

Le `PUT` public n'existe pas (`405`). L'écriture passe donc toujours par
l'admin.

## Adapter un outil (de localStorage vers la plateforme)

```js
// AVANT
localStorage.setItem("guide", JSON.stringify(state));
const state = JSON.parse(localStorage.getItem("guide") || "{}");

// APRÈS
await window.BLOC.save({ guide: state });      // persiste (admin)
const state = window.BLOC.get("guide") || {};  // relit (déjà injecté)
```

Flux : tu colles le code de l'éditeur **une seule fois** dans un bloc.
Tu ouvres **« Ouvrir l'éditeur ↗ »** (surface `/blocs/<slug>/app`), tu
édites, `window.BLOC.save(...)` persiste le contenu. Toute vue publique du
bloc (ou une visionneuse qui lit son slug) reflète la mise à jour.

## Exemple : bloc « visionneuse » (lit un autre bloc par slug)

```html
<div id="vue">Chargement…</div>
<script>
(function () {
  // Bloc source : configurable via une donnée "source" de CE bloc.
  var source = (window.BLOC && window.BLOC.get("source")) || "guide-logiciel";
  var el = document.getElementById("vue");

  function rendu(data) {
    if (Array.isArray(data.ecrans)) {
      el.innerHTML = data.ecrans.map(function (ec) {
        return '<figure style="margin:0 0 16px">'
          + (ec.image ? '<img src="' + ec.image + '" style="max-width:100%">' : '')
          + (ec.titre ? '<figcaption>' + ec.titre + '</figcaption>' : '')
          + '</figure>';
      }).join("");
    } else {
      el.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    }
  }

  function charger() {
    fetch("/api/outils/" + source + "/donnees", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (res) { rendu(res.data || {}); })
      .catch(function (e) { el.textContent = "Erreur (" + e.message + ")"; });
  }

  charger();
  setInterval(charger, 10000); // rafraîchit en direct
})();
</script>
```
