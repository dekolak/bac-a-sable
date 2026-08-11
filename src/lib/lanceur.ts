// Constantes partagées du lanceur (« Mes outils »).

// Palette de couleurs pour le fond des tuiles.
export const COULEURS = [
  "#2f6fed", // bleu
  "#4fa8e0", // bleu clair
  "#7bc86c", // vert
  "#4fd0c0", // turquoise
  "#e8a33d", // ambre
  "#e08a4f", // orange
  "#e0575a", // rouge
  "#c86cb0", // magenta
  "#8f7be0", // violet
  "#6c9ce0", // bleu doux
  "#b7c74f", // olive
  "#5b6572", // gris ardoise
];

// Jeu d'icônes (emojis) proposé dans le sélecteur, regroupé par thème.
// Volontairement large : l'utilisateur peut aussi coller n'importe quel emoji.
export const EMOJIS: { titre: string; liste: string[] }[] = [
  {
    titre: "Travail & bureau",
    liste: [
      "🔧", "🧰", "⚙️", "🛠️", "📊", "📈", "📉", "📅", "📆", "🗓️",
      "📁", "📂", "🗂️", "📇", "📋", "📌", "📎", "🖇️", "✂️", "📝",
      "📄", "📃", "🧾", "🧮", "🖊️", "🖋️", "✏️", "🗃️", "🗄️", "📥",
    ],
  },
  {
    titre: "Communication & web",
    liste: [
      "✉️", "📧", "💬", "🗨️", "📣", "📢", "🔔", "📞", "☎️", "📱",
      "💻", "🖥️", "⌨️", "🖱️", "🌐", "🔗", "📡", "📶", "🛰️", "📨",
    ],
  },
  {
    titre: "Fichiers & données",
    liste: [
      "🗒️", "📚", "📖", "🔖", "🏷️", "💾", "💽", "💿", "🖲️", "🗜️",
      "🔒", "🔓", "🔑", "🗝️", "🛡️", "🔍", "🔎", "🧭", "⏱️", "⏰",
    ],
  },
  {
    titre: "Argent & commerce",
    liste: [
      "💰", "💳", "🧾", "🏦", "💵", "💶", "🪙", "🛒", "🛍️", "🏷️",
      "📦", "🚚", "🏬", "🏪", "💼", "📮", "🎯", "📐", "📏", "🖇️",
    ],
  },
  {
    titre: "Création & média",
    liste: [
      "🎨", "🖌️", "🖍️", "📷", "📸", "🎥", "🎬", "🖼️", "🎞️", "🎵",
      "🎧", "🎙️", "🔊", "📺", "📹", "✨", "💡", "🔦", "🕹️", "🎮",
    ],
  },
  {
    titre: "Divers",
    liste: [
      "🚀", "⭐", "❤️", "✅", "⚡", "🔥", "🌟", "🏠", "🏢", "🗺️",
      "🧠", "👤", "👥", "🤝", "🎓", "🩺", "🧪", "🔬", "🌦️", "☕",
    ],
  },
];

// Validation légère d'une couleur hex (#rgb ou #rrggbb).
export function isHexColor(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
}

// Normalise une URL saisie : ajoute https:// si le schéma manque.
export function normaliseUrl(u: string): string {
  const t = u.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : "https://" + t;
}
