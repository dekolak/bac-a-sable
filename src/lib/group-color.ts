// Couleur d'un groupe, dérivée de son nom (déterministe et stable).
// Pas de stockage ni de configuration : deux blocs du même groupe ont
// toujours la même couleur, partout.
const PALETTE = [
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
