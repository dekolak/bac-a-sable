# Déploiement (Coolify)

La plateforme est **une seule app Next.js** + une base PostgreSQL. On ne
redéploie jamais pour ajouter un outil : un nouveau bloc = une entrée en
base via l'interface admin.

## 1. Base de données

Créer un PostgreSQL (service Coolify ou externe). Noter la chaîne de
connexion.

## 2. Application

Déployer ce dépôt via le **Dockerfile** fourni (base `node:22-slim`). Au
démarrage, `docker-entrypoint.sh` exécute automatiquement :

```
prisma migrate deploy   # applique les migrations en attente (idempotent)
prisma db seed          # crée/mets à jour l'admin si ADMIN_* sont fournis
next start              # sert l'app sur le port 3000
```

## 3. Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | connexion PostgreSQL |
| `APP_URL` | URL publique pour le snippet d'embed (optionnelle ; déduite de l'hôte sinon) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin initial (amorçage ; retirable ensuite) |

La liste exacte, le port et le chemin du Dockerfile sont détaillés dans
[`docs/COOLIFY.md`](./docs/COOLIFY.md).

## 4. Après le premier déploiement

1. Se connecter sur `/login` avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
2. Créer un bloc, coller son code, remplir ses données, choisir sa
   visibilité.
3. Pour un bloc public, copier le snippet depuis l'onglet **Partage** et
   le coller sur le site client.

## Notes

- **Migrations** : toute évolution du schéma se fait via
  `prisma migrate dev` en local (commit du dossier `prisma/migrations/`),
  appliquée automatiquement au déploiement suivant.
- **Sécurité de l'embed** : les blocs sont rendus dans une iframe
  `sandbox` — le code d'un bloc ne peut pas toucher la plateforme ni le
  site hôte.
- **Sauvegardes** : sauvegarder régulièrement la base (tout l'état des
  blocs et de leurs données y vit).
