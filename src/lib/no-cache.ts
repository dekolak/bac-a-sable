// En-têtes pour empêcher toute mise en cache d'une réponse — navigateur
// ET caches intermédiaires (reverse-proxy, CDN).
//
// `CDN-Cache-Control` et `Cloudflare-CDN-Cache-Control` ciblent
// explicitement les CDN/edge (ex. Cloudflare) qui peuvent ignorer un
// simple `Cache-Control` (notamment sous une règle « Cache Everything »).
// Indispensable pour les données d'un bloc, qui doivent toujours refléter
// la dernière écriture.
export const NO_CACHE_HEADERS: Record<string, string> = {
  "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
  "cdn-cache-control": "no-store",
  "cloudflare-cdn-cache-control": "no-store",
};
