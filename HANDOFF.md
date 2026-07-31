# HANDOFF — Boîte à outils / bac à sable

Document d'état du projet, phase par phase. Toute instance qui reprend
une session lit ce fichier en premier.

---

## Vision

Une seule infrastructure, plusieurs **blocs** isolés. Un bloc = un petit
outil HTML/JS autonome. Objectif central : **créer un bloc ne demande
jamais un déploiement** — juste une entrée en base.

Repo neuf, indépendant de `pose` et `dx`, même logique architecturale
(Next.js + Prisma + PostgreSQL, Coolify).

---

## Phase 0 — Squelette V1 (fait)

Périmètre livré : **auth plateforme + liste de blocs + stockage
générique + zone d'édition/collage de code + statut public/privé/partagé
+ intégration externe lecture seule**. Pas de rôles fins (conforme à la
demande V1).

### Modèle de données (`prisma/schema.prisma`)

- **`User`** — l'admin (email + `passwordHash` bcrypt). Une seule ligne
  en V1, modélisé proprement.
- **`Session`** — session serveur, cookie httpOnly opaque, TTL 30 j.
- **`Bloc`** — `slug` unique (→ `/outils/<slug>`), `nom`, `description`,
  `code` (le HTML/JS collé), `visibilite` (`PUBLIC|PRIVE|PARTAGE`),
  `statut` (`BROUILLON|TEST|PROD`).
- **`BlocDonnee`** — stockage clé-valeur générique. `valeur` en `Json`
  (aucun schéma rigide). **Isolation** : `@@unique([blocId, cle])` +
  toutes les requêtes scopées par `blocId` → aucune fuite entre blocs.
- **`BlocInvitation`** — amis invités sur un bloc `PARTAGE` : `email` +
  `token` (lien magique), révocable, limité à ce bloc. Pas de compte.

Migration initiale : `prisma/migrations/00000000000000_init/`.

### Décisions structurantes (validées avant code)

1. **Champ code** = un seul HTML libre, rendu en **iframe sandbox**.
   Colle au « je colle mon code ». Séparation HTML/CSS/JS repoussée.
2. **Embed** = **iframe** injectée par un script (isolation forte,
   auto-resize via `postMessage`), pas d'injection DOM inline.
3. **Statut** = simple **label** ; l'accès est piloté uniquement par la
   **visibilité**. (Un bloc `TEST` reste donc embarquable — scénario
   guide.)
4. **Amis (`PARTAGE`)** = **lien magique** par email, sans mot de passe.
5. **Écriture des données** = 100 % côté plateforme. L'API publique
   `/api/outils/<slug>/donnees` est **strictement lecture seule** (avec
   CORS `*`). C'est ce qui garantit « le site client ne se reconnecte
   jamais pour mettre à jour ».

### Architecture des pages (Next.js App Router)

- Espace admin, groupe `(admin)` gardé par `requireUser()` :
  `/admin` (liste), `/blocs/nouveau`, `/blocs/[slug]` (éditeur en onglets
  Code / Données / Partage / Réglages).
- Espace public :
  - `/outils/[slug]` — vue humaine, iframe sandbox plein écran.
  - `/outils/[slug]/embed` (route handler) — **document HTML autonome**
    du bloc, données injectées côté serveur (`window.BLOC.get(cle)`).
  - `/outils/[slug]/embed.js` (route handler) — loader qui injecte
    l'iframe + gère l'auto-resize.
  - `/api/outils/[slug]/donnees` (route handler) — JSON lecture seule.
  - `/p/[token]` (route handler) — entrée d'un ami invité : valide le
    token, pose le cookie invité (`bo_guest`), redirige vers l'outil.

### Contrôle d'accès (`src/lib/access.ts`)

`canReadBloc(bloc)` :
- `PUBLIC` → toujours.
- admin connecté → tout.
- `PARTAGE` → invité avec un token valide pour **ce** bloc.
- `PRIVE` sans admin → refusé.

Appliqué de façon uniforme par `/outils/**` et l'API data.

### Rendu d'un bloc (`src/lib/render.ts`)

`buildBlocDocument(bloc, donnees)` construit le document : un runtime
`window.BLOC` (données sérialisées côté serveur, échappées pour `<script>`)
puis le code collé, puis un bootstrap `postMessage` pour l'auto-resize.
Chaque chargement d'iframe repart de l'état à jour en base.

### Vérification bout en bout (faite)

Contre un **vrai PostgreSQL** + **vrai `next start`** (pas seulement le
build) :
- `npm run build` : compile + type-check + lint OK, 11 routes.
- API publique : renvoie bien les clés-valeurs du bloc public.
- `/embed` : document rendu avec données injectées + code exécuté.
- **Isolation vérifiée** : bloc `PRIVE` → `404` en anonyme sur `/embed`
  ET sur l'API ; bloc inconnu → `404`. Avec cookie admin → `200`.
- Garde admin : `/admin` sans session → `307` vers `/login` ; avec
  session forgée → dashboard rendu, éditeur accessible.

### Login vérifié en navigateur réel (Playwright, vrais clics)

Test `e2e/login.mjs` (`npm run test:e2e`, serveur + base démarrés) — 9/9 :
- garde `/admin` anonyme → `/login` ;
- mauvais mot de passe → « Identifiants incorrects. », reste sur
  `/login`, **aucune session** ;
- bon mot de passe → redirection `/admin`, **cookie `bo_session`
  httpOnly** posé, dashboard visible ;
- session persistante après navigation.

**Bug UX trouvé et corrigé grâce au test réel** : React 19 réinitialise
le formulaire après une action serveur, ce qui vidait aussi le champ
email après un échec de connexion. Corrigé en réémettant l'email dans
l'état de l'action (`login/actions.ts`) et en l'utilisant comme
`defaultValue` (`login/login-form.tsx`) — l'email survit au reset, le mot
de passe reste vidé (voulu).

Note : `output: "standalone"` retiré de `next.config.mjs` (le Dockerfile
lance `next start`, l'artefact standalone était inutile et déclenchait un
avertissement).

### URL publique résolue à l'exécution (piège dx évité)

`NEXT_PUBLIC_APP_URL` remplacée par `APP_URL` (`src/lib/app-url.ts`). Les
variables `NEXT_PUBLIC_*` sont **inlinées au build** — prouvé : la valeur
était figée dans `.next/server/.../page.js`. Une valeur posée dans Coolify
aurait donc été ignorée. `APP_URL` est une variable runtime classique,
avec repli automatique sur `X-Forwarded-Host`/`Host`. Vérifié : le snippet
d'embed reflète bien la valeur runtime (jamais vue au build) et le repli
sur l'hôte fonctionne. Doc de déploiement exacte : `docs/COOLIFY.md`
(variables, port 3000, chemin du Dockerfile).

---

## Scénario cible (à re-tester en conditions réelles)

Éditeur de guide interactif → un bloc `PUBLIC`/`TEST` :
1. coller le code de l'éditeur dans l'onglet **Code** ;
2. mettre le contenu du guide dans **Données** (clé `guide`, valeur JSON) ;
3. copier le snippet de l'onglet **Partage** sur un site client ;
4. modifier le contenu depuis la plateforme → l'iframe affiche la MAJ.

Le rendu + l'injection de données sont vérifiés ; reste à valider dans un
navigateur réel avec un vrai code d'éditeur collé.

---

## Décidé hors scope

- **Envoi d'email d'invitation (terminé — hors scope).** Le lien
  d'invitation est généré et **affiché dans l'admin** (onglet Partage) ;
  le partager en copier-coller manuel suffit à l'usage prévu. Décision
  actée : **on ne branche pas de transport email** (ni Resend, ni SMTP).
  Rien à faire côté code.

## Ce qui n'est PAS encore fait (roadmap)

- **API d'écriture programmatique** (ex. pousser des données depuis un
  outil externe autorisé). V1 : écriture via l'UI admin uniquement.
- **Versionnage / historique** du code et des données d'un bloc.
- **PWA** : usage desktop → non prioritaire, à confirmer.
- **Durcissement** : rate-limit login, rotation de session, CSP explicite
  sur `/embed` (`frame-ancestors`).
- **Séparation HTML/CSS/JS ou assets** si un outil futur le réclame.

---

## Méthode

Diagnostic avant code ; décisions structurantes posées et validées avant
d'écrire ; vérification bout en bout (vraie base, vrai serveur) et pas
seulement « ça compile » ; jamais de merge sans validation explicite.
Mettre ce fichier à jour avant de clore une session.

## Repères techniques

- `src/lib/prisma.ts` — singleton Prisma.
- `src/lib/auth.ts` — sessions serveur (`createSession`, `getCurrentUser`,
  `requireUser`, `destroySession`).
- `src/lib/guest.ts` — cookie invité pour les blocs partagés.
- `src/lib/access.ts` — décision d'accès en lecture.
- `src/lib/render.ts` — construction du document d'un bloc.
- `src/lib/slug.ts` — slugification / validation.
- Actions serveur : `src/app/(admin)/blocs/actions.ts` (CRUD blocs,
  données, invitations), `src/app/login/actions.ts`, `(admin)/actions.ts`.
