/** Normalise un texte libre en slug URL : minuscules, tirets, ascii. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // enlève les accents (diacritiques combinants)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return slug.length >= 1 && slug.length <= 60 && SLUG_RE.test(slug);
}
