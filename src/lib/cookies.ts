import "server-only";

// Attribut `Secure` des cookies (session admin + invité).
// Par défaut : actif en production. Override explicite via COOKIE_SECURE,
// utile TEMPORAIREMENT pour se connecter en HTTP le temps de configurer
// HTTPS/Traefik : un cookie `Secure` est refusé par le navigateur sur une
// origine HTTP (sauf localhost) → boucle de redirection vers /login.
//   COOKIE_SECURE=false → jamais Secure (HTTP OK)   ⚠️ à retirer une fois en HTTPS
//   COOKIE_SECURE=true  → toujours Secure
//   (absent)            → Secure si NODE_ENV=production
export function cookieSecure(): boolean {
  const override = process.env.COOKIE_SECURE?.toLowerCase();
  if (override === "false") return false;
  if (override === "true") return true;
  return process.env.NODE_ENV === "production";
}
