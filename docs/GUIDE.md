# Guide d'utilisation — Boîte à outils / bac à sable

Guide complet de la plateforme : concepts, prise en main, écriture d'un
outil, intégration externe, partage, organisation. Pour le déploiement,
voir [`DEPLOY.md`](../DEPLOY.md) et [`COOLIFY.md`](./COOLIFY.md) ; pour la
référence de l'API d'un bloc, [`BLOCS.md`](./BLOCS.md).

---

## 1. À quoi ça sert

Héberger des petits outils HTML/JS (calculateurs, guides interactifs,
simulateurs…) sur **une seule infrastructure**. Chaque outil est un
**bloc** isolé. Créer un nouvel outil = **une entrée en base**, jamais un
déploiement.

## 2. Les concepts

Un **bloc** réunit trois choses distinctes :

| Couche | Contenu | Écrit par | Lu par |
|---|---|---|---|
| **Code** | le HTML/JS collé (le rendu de l'outil) | toi (admin) | moteur de rendu (iframe) |
| **Données** | stockage clé-valeur générique (`Json`) | toi (et l'outil sur sa surface d'édition) | l'outil + l'API publique |
| **Accès** | visibilité + statut + groupe | toi | garde d'accès |

Chaque bloc a :
- un **slug** unique → son URL `/outils/<slug>` ;
- une **visibilité** : `PUBLIC` (accessible sans connexion, embarquable),
  `PRIVE` (toi seul), `PARTAGE` (amis invités par lien magique, limité à
  ce bloc) ;
- un **statut** : `BROUILLON` / `TEST` / `PROD` (indicatif — c'est la
  visibilité qui pilote l'accès) ;
- un **groupe / projet** (optionnel) pour l'organisation sur l'accueil ;
- un **stockage isolé** : les données d'un bloc ne fuient jamais vers un
  autre (`@@unique([blocId, cle])` + requêtes toujours scopées par bloc).

## 3. Authentification

**Deux niveaux :**

1. **Plateforme** — un seul admin (toi), email + mot de passe, session
   serveur (cookie httpOnly). L'admin est créé au premier démarrage à
   partir de `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
2. **Bloc** — chaque bloc décide qui y accède via sa **visibilité** :
   - `PUBLIC` : tout le monde, sans connexion ;
   - `PRIVE` : l'admin connecté uniquement ;
   - `PARTAGE` : les amis que tu invites par email reçoivent un **lien
     magique** (`/p/<token>`), révocable, valable pour ce seul bloc.

> En HTTP simple (avant HTTPS/Traefik), pose la variable
> `COOKIE_SECURE=false` sinon le cookie de session est refusé et la
> connexion boucle sur `/login`. À retirer une fois en HTTPS. Détails :
> [`COOLIFY.md` §6](./COOLIFY.md).

## 4. Prise en main (admin)

1. **Se connecter** sur `/login`.
2. **Accueil** `/admin` : la liste de tes blocs, **regroupée par groupe**
   (chaque groupe a une couleur automatique) avec badges visibilité/statut.
3. **Créer un bloc** : `/blocs/nouveau` (nom, slug, visibilité, statut).
4. **Éditer un bloc** : `/blocs/<slug>`, en onglets :
   - **Code** — colle/édite le HTML/JS + **Aperçu** live ;
   - **Données** — l'éditeur clé-valeur (JSON) : c'est là que tu mets à
     jour le contenu ;
   - **Partage** — visibilité, invitations (pour `PARTAGE`) et le snippet
     d'intégration à copier (pour `PUBLIC`) ;
   - **Réglages** — nom, slug, description, **groupe**, visibilité, statut,
     suppression.

En haut de la page d'un bloc : **« Ouvrir l'éditeur ↗ »** (surface
d'édition, voir §5) et **« Vue publique ↗ »**.

## 5. Écrire un outil qui stocke ses données

Un outil collé peut lire **et** écrire ses données via `window.BLOC`, au
lieu de `localStorage` (fini la limite de taille du navigateur, tout part
en base).

```js
// Lecture (partout, synchrone — données injectées au rendu)
const etat = window.BLOC.get("cle") || {};
window.BLOC.slug        // le slug du bloc lui-même
window.BLOC.keys()      // les clés disponibles

// Écriture (seulement sur la surface d'édition admin /blocs/<slug>/app)
await window.BLOC.save({ cle: etat });   // plusieurs clés (fusion)
await window.BLOC.set("cle", valeur);    // une clé
window.BLOC.canWrite    // true sur la surface d'édition
```

- **Lecture** : disponible dans tout rendu de bloc, sans requête réseau.
- **Écriture** : uniquement quand tu ouvres le bloc via
  **« Ouvrir l'éditeur ↗ »** = `/blocs/<slug>/app` (le bloc y tourne
  connecté à ta session ; l'embed public reste en **lecture seule**).

Adapter un outil qui utilisait `localStorage` :

```js
// AVANT → APRÈS
localStorage.setItem("x", JSON.stringify(s))  →  await window.BLOC.save({ x: s })
JSON.parse(localStorage.getItem("x") || "{}") →  window.BLOC.get("x") || {}
```

Référence complète du shim et des endpoints : [`BLOCS.md`](./BLOCS.md).

## 6. Publier / intégrer sur un site externe

Passe le bloc en **PUBLIC**. L'onglet **Partage** te donne un snippet à
coller sur n'importe quel site :

```html
<div id="bloc-mon-outil"></div>
<script src="https://ta-plateforme/outils/mon-outil/embed.js" data-cible="#bloc-mon-outil"></script>
```

Le script injecte une **iframe sandbox** (isolation totale du site hôte)
avec auto-redimensionnement. Un bloc public expose aussi :
- `/outils/<slug>/embed` — le rendu nu (dans l'iframe) ;
- `/api/outils/<slug>/donnees` — une **API JSON lecture seule** (CORS `*`).

Le site client ne fait que **lire** ; toute mise à jour se fait depuis ta
plateforme. Les réponses sont marquées non-cachables (navigateur + CDN)
pour toujours refléter la dernière écriture.

## 7. Partager avec des amis (bloc PARTAGE)

1. Passe le bloc en **PARTAGE** (Réglages).
2. Onglet **Partage** : invite par email → un **lien magique**
   `/p/<token>` est généré (à transmettre manuellement).
3. L'ami ouvre le lien → accès à **ce bloc uniquement**, sans compte.
   Révocable à tout moment.

## 8. Organiser ses blocs

- **Groupe / Projet** (Réglages) : texte libre (ex. « Kiavik »,
  « Dxonjet »). L'accueil regroupe les blocs par groupe, chaque groupe
  ayant une **couleur automatique** (dérivée du nom, stable).
- **Lien éditeur ↔ visionneuse** : quand un bloc « visionneuse » lit un
  bloc « éditeur » (via une donnée `source` = slug de l'éditeur), la page
  de chaque bloc affiche un lien rapide vers l'autre (« Éditeur lié → » /
  « Visionneuse liée → »).

## 9. Cas d'usage complet : éditeur de guide + visionneuse

C'est le scénario fondateur (deux blocs).

1. **Bloc éditeur** (`PUBLIC`) : colle le code de l'éditeur **une fois**.
   Édite via **« Ouvrir l'éditeur ↗ »** ; l'outil persiste son contenu
   avec `window.BLOC.save()` (plus de copier-coller de code).
2. **Bloc visionneuse** (`PUBLIC`) : colle le code de la visionneuse.
   Dans son onglet **Données**, mets la clé **`source`** = slug de
   l'éditeur. La visionneuse lit l'API publique de l'éditeur et affiche le
   contenu à jour.
3. **Intégration** : colle le snippet de la visionneuse sur le site
   client. Tu édites depuis la plateforme → le site reflète la MAJ, sans
   jamais recoller de code.

Duplication pour un nouveau projet : duplique la paire, donne-leur le même
**Groupe**, et règle la donnée `source` de la nouvelle visionneuse sur le
slug du nouvel éditeur.

## 10. Référence rapide

**Pages**

| URL | Rôle |
|---|---|
| `/login` | connexion admin |
| `/admin` | accueil (blocs groupés) |
| `/blocs/nouveau` | créer un bloc |
| `/blocs/<slug>` | éditeur (Code / Données / Partage / Réglages) |
| `/blocs/<slug>/app` | surface d'édition (écriture via `window.BLOC`) |
| `/outils/<slug>` | rendu public plein écran |
| `/outils/<slug>/embed` | rendu nu (iframe) |
| `/outils/<slug>/embed.js` | script d'intégration |
| `/p/<token>` | entrée d'un ami invité (bloc partagé) |

**API**

| Route | Accès |
|---|---|
| `GET /api/outils/<slug>/donnees` | public, lecture seule (CORS `*`) |
| `PUT /api/blocs/<slug>/donnees` | admin (session), écriture par fusion |

**Variables d'environnement** (détail : [`COOLIFY.md`](./COOLIFY.md))

| Nom | Rôle |
|---|---|
| `DATABASE_URL` | connexion PostgreSQL (obligatoire, runtime) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin initial (seed) |
| `APP_URL` | URL publique pour le snippet (optionnelle) |
| `COOKIE_SECURE` | `false` pour se connecter en HTTP (temporaire) |

## 11. Voir aussi

- [`BLOCS.md`](./BLOCS.md) — référence de `window.BLOC` + endpoints + exemple de visionneuse.
- [`COOLIFY.md`](./COOLIFY.md) — variables exactes, port, Dockerfile, HTTPS/cookies.
- [`DEPLOY.md`](../DEPLOY.md) — étapes de déploiement Coolify.
- [`../README.md`](../README.md) — présentation et démarrage local.
- [`../HANDOFF.md`](../HANDOFF.md) — état détaillé du projet, phase par phase.
