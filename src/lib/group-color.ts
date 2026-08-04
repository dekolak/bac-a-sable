// Couleur d'un groupe, dérivée de son nom (déterministe et stable).
// C'est la couleur AUTOMATIQUE par défaut : deux blocs du même groupe ont
// toujours la même, partout. Elle sert de repli quand aucune couleur n'a été
// choisie manuellement pour le groupe (voir GroupeReglage / resolveCouleur).
export const PALETTE = [
  "#e8a33d", // ambre
  "#4fa8e0", // bleu
  "#7bc86c", // vert
  "#c86cb0", // magenta
  "#e0575a", // rouge
  "#8f7be0", // violet
  "#4fd0c0", // turquoise
  "#e08a4f", // orange
  "#6c9ce0", // bleu clair
  "#b7c74f", // olive
];

export function groupeColor(nom: string): string {
  let h = 0;
  for (let i = 0; i < nom.length; i++) {
    h = (h * 31 + nom.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}

// Couleur effective d'un groupe : l'override choisi s'il existe, sinon la
// couleur automatique. `overrides` = map nom de groupe → couleur (hex).
export function resolveCouleur(
  nom: string,
  overrides?: Map<string, string> | Record<string, string>,
): string {
  const o =
    overrides instanceof Map ? overrides.get(nom) : overrides?.[nom];
  return o || groupeColor(nom);
}

// Validation légère d'une couleur hex (#rgb ou #rrggbb).
export function isHexColor(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
}
