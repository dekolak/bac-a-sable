# Boîte à outils / bac à sable

Plateforme perso pour héberger des petits outils HTML/JS (calculateurs,
guides interactifs, simulateurs…) sur **une seule infrastructure**.
Chaque outil est un **bloc** isolé : son propre code, son propre stockage
clé-valeur, sa propre URL, son propre statut d'accès. Créer un bloc =
une entrée en base, **jamais un déploiement**.

## Stack

- **Next.js** (App Router) — front + API dans une seule app
- **Prisma** + **PostgreSQL**
- Déploiement **Coolify** (Dockerfile fourni)

## Concepts

Un **bloc** porte trois choses distinctes :

| Couche | Contenu | Écrit par | Lu par |
|---|---|---|---|
| Code | HTML/JS collé (rendu iframe sandbox) | admin | moteur de rendu |
| Données | stockage clé-valeur générique (`Json`) | admin | l'outil + l'API publique |
| Accès | visibilité + statut | admin | garde d'accès |

**Deux niveaux d'authentification :**
1. **Plateforme** — un admin (email/mot de passe, session serveur).
2. **Bloc** — chaque bloc est `PUBLIC` (embarquable sans connexion),
   `PRIVE` (admin seul) ou `PARTAGE` (amis invités par lien magique,
   accès limité à ce bloc).

**Intégration externe** — un bloc public expose :
- une iframe de rendu : `/outils/<slug>/embed`
- un script clé-en-main : `/outils/<slug>/embed.js`
- une API JSON **lecture seule** : `/api/outils/<slug>/donnees`

Le site client ne fait que lire ; toute mise à jour se fait depuis la
plateforme. L'iframe recharge toujours la version à jour.

## Démarrage local

```bash
cp .env.example .env          # ajuster si besoin
docker compose up -d          # PostgreSQL local
npm install
npm run prisma:migrate        # applique les migrations
npm run db:seed               # crée l'admin (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev                   # http://localhost:3000
```

## Organisation

Chaque bloc peut porter un **groupe / projet** (texte libre) : l'accueil
regroupe les blocs par groupe, avec une couleur automatique. Quand une
« visionneuse » lit un bloc « éditeur » (donnée `source`), un lien rapide
relie les deux pages.

## Pages

| URL | Rôle |
|---|---|
| `/login` | connexion admin |
| `/admin` | accueil (blocs groupés par projet) |
| `/blocs/nouveau` | créer un bloc |
| `/blocs/<slug>` | éditeur (Code / Données / Partage / Réglages) |
| `/blocs/<slug>/app` | surface d'édition (écriture via `window.BLOC`) |
| `/outils/<slug>` | rendu public plein écran |
| `/outils/<slug>/embed` | rendu nu (iframe) |
| `/outils/<slug>/embed.js` | script d'intégration |
| `/p/<token>` | entrée d'un ami invité (bloc partagé) |

## Documentation

- [`docs/GUIDE.md`](./docs/GUIDE.md) — **guide d'utilisation complet** (commence ici).
- [`docs/BLOCS.md`](./docs/BLOCS.md) — API `window.BLOC` + endpoints + exemple de visionneuse.
- [`docs/COOLIFY.md`](./docs/COOLIFY.md) — variables d'env exactes, port, Dockerfile.
- [`DEPLOY.md`](./DEPLOY.md) — déploiement · [`HANDOFF.md`](./HANDOFF.md) — état du projet.
