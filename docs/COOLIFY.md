# Déploiement Coolify — référence exacte

Réponses directes aux trois questions, toutes vérifiées contre le code
(pas de variable fantôme, contrairement à dx) :

| Question | Réponse |
|---|---|
| **Port à exposer** | `3000` |
| **Chemin du Dockerfile** | `Dockerfile` (à la racine du dépôt) |
| **Contexte de build** | racine du dépôt (`.`) |

---

## 1. Variables d'environnement (noms EXACTS)

Seules ces variables sont lues par le code. Les noms sont
sensibles à la casse — les copier tels quels.

| Nom exact | Obligatoire | Quand | Rôle |
|---|---|---|---|
| `DATABASE_URL` | **Oui** | Runtime | Chaîne de connexion PostgreSQL (Prisma). |
| `ADMIN_EMAIL` | Au 1er démarrage | Runtime (seed) | Email de l'admin créé par le seed. |
| `ADMIN_PASSWORD` | Au 1er démarrage | Runtime (seed) | Mot de passe de l'admin (voir note ci-dessous). |
| `APP_URL` | Non (optionnelle) | Runtime | URL publique pour le snippet d'embed. Si absente, déduite de l'hôte de la requête. |

Variables gérées automatiquement — **ne pas les définir à la main** :

| Nom | Détail |
|---|---|
| `NODE_ENV` | Fixée à `production` par l'image (`ENV NODE_ENV=production`). |
| `PORT` | Optionnelle ; défaut `3000`. `next start` la respecte si Coolify en injecte une. |

### Bloc à copier dans Coolify

```
DATABASE_URL=postgresql://UTILISATEUR:MOTDEPASSE@HOTE:5432/BASE?schema=public
ADMIN_EMAIL=contact@dekolak.fr
ADMIN_PASSWORD=un-mot-de-passe-fort
APP_URL=https://outils.dekolak.fr
```

> ⚠️ **Pas de `SESSION_SECRET`**, **pas de `NEXT_PUBLIC_APP_URL`** : ces
> deux noms **n'existent pas** dans ce projet. Les sessions sont des
> tokens aléatoires opaques stockés en base (aucun secret à configurer),
> et l'URL publique est `APP_URL` (variable runtime classique), pas une
> variable `NEXT_PUBLIC_*`.

---

## 2. Pourquoi ces distinctions build / runtime comptent

Ce sont exactement les pièges qui ont posé problème sur dx :

- **`DATABASE_URL` n'est PAS nécessaire au build.** Vérifié : `npm run
  build` réussit sans elle (le client Prisma se génère sans connexion, et
  les pages sont dynamiques donc aucune requête à la compilation). Il
  suffit donc de la définir comme variable **runtime**. Pas de build-arg.

- **`APP_URL` est lue à l'exécution**, pas figée au build. On a
  volontairement évité une variable `NEXT_PUBLIC_*` : celles-ci sont
  inlinées dans le bundle au moment du `next build`, donc une valeur
  posée dans Coolify serait **ignorée**. Avec `APP_URL` (runtime), la
  valeur de Coolify est bien prise en compte ; si on l'oublie, l'URL est
  déduite des en-têtes `X-Forwarded-Host` / `Host` du reverse-proxy —
  donc correcte quand même.

---

## 3. Séquence de démarrage du conteneur

Le `CMD` du Dockerfile exécute, à chaque démarrage :

```
npx prisma migrate deploy   # applique les migrations en attente (idempotent)
npx prisma db seed          # crée/met à jour l'admin si ADMIN_* sont fournis
npm run start               # next start, port 3000
```

**Note sur le seed** : il fait un *upsert* de l'admin. Tant que
`ADMIN_EMAIL` / `ADMIN_PASSWORD` restent définies, **le mot de passe est
réappliqué à chaque redéploiement** (pratique pour le réinitialiser via
Coolify). Une fois l'admin en place, on peut retirer ces deux variables :
le seed devient alors sans effet.

---

## 4. Base de données

Créer un service PostgreSQL (Coolify ou externe) et reporter ses
identifiants dans `DATABASE_URL`. Le schéma et les migrations sont dans
`prisma/` ; `migrate deploy` s'occupe de tout au premier démarrage. Aucun
`prisma migrate` manuel à lancer.

---

## 5. Récapitulatif « anti-erreur de nommage »

- [ ] `DATABASE_URL` définie (runtime) et pointant sur la bonne base
- [ ] `ADMIN_EMAIL` + `ADMIN_PASSWORD` définies pour le premier démarrage
- [ ] `APP_URL` définie sur l'URL publique finale (ou laissée vide en
      confiance dans le proxy)
- [ ] **Aucune** variable `SESSION_SECRET` ni `NEXT_PUBLIC_APP_URL` (elles
      n'existent pas ici)
- [ ] Port applicatif : `3000`
- [ ] Dockerfile : `Dockerfile` à la racine, contexte `.`
