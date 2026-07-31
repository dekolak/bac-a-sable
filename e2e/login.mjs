// Vérification bout en bout du login admin avec de vrais clics.
// Prérequis : serveur (npm run start) + base démarrés, admin seedé.
//   node e2e/login.mjs
//   (CHROMIUM_PATH=/chemin/vers/chrome si navigateur préinstallé)
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.ADMIN_EMAIL || "contact@dekolak.fr";
const GOOD = process.env.ADMIN_PASSWORD || "dev-password";
const SHOTS = process.env.SHOTS_DIR || "/tmp";

let failures = 0;
function check(label, cond) {
  console.log(`${cond ? "✓" : "✗"} ${label}`);
  if (!cond) failures++;
}

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const ctx = await browser.newContext();
const page = await ctx.newPage();

// ── Garde : /admin sans session redirige vers /login ────────────
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
check("garde: /admin anonyme redirige vers /login", page.url().endsWith("/login"));

// ── Mauvais mot de passe → erreur, pas de session ───────────────
await page.goto(`${BASE}/login`, { waitUntil: "load" });
await page.waitForSelector("#password");
await page.fill("#email", EMAIL);
await page.fill("#password", "mauvais-mot-de-passe");
await page.click('button[type="submit"]');
await page.getByText("Identifiants incorrects.").waitFor({ state: "visible", timeout: 5000 });
check("mauvais mdp: message « Identifiants incorrects. » affiché", true);
check(`mauvais mdp: reste sur /login`, page.url().includes("/login"));
check("mauvais mdp: aucune session créée", !(await ctx.cookies()).some((c) => c.name === "bo_session"));
// L'email doit survivre à l'erreur (pas de retape).
check(
  "mauvais mdp: email conservé dans le champ",
  (await page.inputValue("#email")) === EMAIL,
);
await page.screenshot({ path: `${SHOTS}/login-bad.png` });

// ── Correction du seul mot de passe → session → /admin ──────────
await page.fill("#password", GOOD);
await Promise.all([
  page.waitForURL("**/admin", { timeout: 8000 }),
  page.click('button[type="submit"]'),
]);
check("bon mdp: redirigé vers /admin", page.url().endsWith("/admin"));
check("bon mdp: dashboard visible (Mes blocs)", await page.getByText("Mes blocs").isVisible());
const sess = (await ctx.cookies()).find((c) => c.name === "bo_session");
check("bon mdp: cookie de session posé (httpOnly)", !!sess && sess.httpOnly === true);
await page.screenshot({ path: `${SHOTS}/login-ok.png` });

// ── Session persistante ─────────────────────────────────────────
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
check("session persiste: /admin reste accessible", page.url().endsWith("/admin"));

await browser.close();
console.log(failures === 0 ? "\nTOUS LES CHECKS PASSENT" : `\n${failures} CHECK(S) EN ÉCHEC`);
process.exit(failures === 0 ? 0 : 1);
