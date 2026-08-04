"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { slugify, isValidSlug } from "@/lib/slug";
import { isHexColor } from "@/lib/group-color";

const visibiliteEnum = z.enum(["PUBLIC", "PRIVE", "PARTAGE"]);
const statutEnum = z.enum(["BROUILLON", "TEST", "PROD"]);

export type FormState = { error?: string };

// ── Création ────────────────────────────────────────────────
const createSchema = z.object({
  nom: z.string().min(1, "Le nom est requis.").max(120),
  slug: z.string().optional(),
  visibilite: visibiliteEnum,
  statut: statutEnum,
});

export async function createBloc(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = createSchema.safeParse({
    nom: formData.get("nom"),
    slug: formData.get("slug"),
    visibilite: formData.get("visibilite"),
    statut: formData.get("statut"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const wanted = parsed.data.slug?.trim() ? parsed.data.slug : parsed.data.nom;
  const slug = slugify(wanted);
  if (!isValidSlug(slug)) {
    return { error: "Slug invalide (lettres, chiffres et tirets)." };
  }

  const exists = await prisma.bloc.findUnique({ where: { slug } });
  if (exists) return { error: `Le slug « ${slug} » est déjà pris.` };

  await prisma.bloc.create({
    data: {
      slug,
      nom: parsed.data.nom,
      visibilite: parsed.data.visibilite,
      statut: parsed.data.statut,
      ownerId: user.id,
    },
  });

  redirect(`/blocs/${slug}`);
}

// ── Réglages (nom, slug, visibilité, statut) ────────────────
const settingsSchema = z.object({
  id: z.string().min(1),
  nom: z.string().min(1).max(120),
  slug: z.string().min(1),
  description: z.string().max(500).optional().nullable(),
  groupe: z.string().max(80).optional().nullable(),
  // Couleur choisie pour le groupe : vide = couleur automatique (pas d'override).
  couleurGroupe: z.string().max(9).optional().nullable(),
  visibilite: visibiliteEnum,
  statut: statutEnum,
});

export async function updateBlocSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = settingsSchema.safeParse({
    id: formData.get("id"),
    nom: formData.get("nom"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    groupe: formData.get("groupe"),
    couleurGroupe: formData.get("couleurGroupe"),
    visibilite: formData.get("visibilite"),
    statut: formData.get("statut"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const slug = slugify(parsed.data.slug);
  if (!isValidSlug(slug)) return { error: "Slug invalide." };

  const clash = await prisma.bloc.findFirst({
    where: { slug, NOT: { id: parsed.data.id } },
    select: { id: true },
  });
  if (clash) return { error: `Le slug « ${slug} » est déjà pris.` };

  const groupe = parsed.data.groupe?.trim() || null;

  await prisma.bloc.update({
    where: { id: parsed.data.id },
    data: {
      nom: parsed.data.nom,
      slug,
      description: parsed.data.description || null,
      groupe,
      visibilite: parsed.data.visibilite,
      statut: parsed.data.statut,
    },
  });

  // Couleur du groupe (override optionnel, partagé par tout le groupe).
  // Trois cas explicites, pour ne JAMAIS écraser par erreur la couleur d'un
  // groupe existant quand on y déplace simplement un bloc sans toucher la
  // couleur :
  //   - hex valide  → on pose/actualise l'override du groupe ;
  //   - "auto"      → reset explicite : on supprime l'override (couleur auto) ;
  //   - vide/autre  → aucun changement (l'override éventuel est laissé tel quel).
  const couleur = parsed.data.couleurGroupe?.trim() || "";
  if (groupe && isHexColor(couleur)) {
    await prisma.groupeReglage.upsert({
      where: { nom: groupe },
      create: { nom: groupe, couleur },
      update: { couleur },
    });
  } else if (groupe && couleur === "auto") {
    await prisma.groupeReglage
      .delete({ where: { nom: groupe } })
      .catch(() => {}); // pas d'override existant : rien à faire
  }

  revalidatePath("/admin");
  revalidatePath(`/blocs/${slug}`);
  redirect(`/blocs/${slug}`);
}

// ── Code du bloc ────────────────────────────────────────────
export async function updateBlocCode(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "");
  if (!id) return { error: "Bloc introuvable." };

  const bloc = await prisma.bloc.update({
    where: { id },
    data: { code },
    select: { slug: true },
  });
  revalidatePath(`/blocs/${bloc.slug}`);
  revalidatePath(`/outils/${bloc.slug}`);
  return {};
}

// ── Données clé-valeur ──────────────────────────────────────
const dataSchema = z.object({
  blocId: z.string().min(1),
  cle: z.string().min(1, "Clé requise.").max(120),
  valeur: z.string(),
});

export async function upsertBlocDonnee(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = dataSchema.safeParse({
    blocId: formData.get("blocId"),
    cle: formData.get("cle"),
    valeur: formData.get("valeur"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  // La valeur est saisie en JSON ; on tolère le texte brut en repli.
  let valeur: unknown;
  try {
    valeur = JSON.parse(parsed.data.valeur);
  } catch {
    valeur = parsed.data.valeur;
  }

  const bloc = await prisma.bloc.findUnique({
    where: { id: parsed.data.blocId },
    select: { slug: true },
  });
  if (!bloc) return { error: "Bloc introuvable." };

  await prisma.blocDonnee.upsert({
    where: { blocId_cle: { blocId: parsed.data.blocId, cle: parsed.data.cle } },
    create: { blocId: parsed.data.blocId, cle: parsed.data.cle, valeur: valeur as never },
    update: { valeur: valeur as never },
  });

  revalidatePath(`/blocs/${bloc.slug}`);
  revalidatePath(`/outils/${bloc.slug}`);
  return {};
}

export async function deleteBlocDonnee(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (id) await prisma.blocDonnee.delete({ where: { id } }).catch(() => {});
  if (slug) revalidatePath(`/blocs/${slug}`);
}

// ── Invitations (blocs PARTAGE) ─────────────────────────────
export async function inviteAmi(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const blocId = String(formData.get("blocId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!blocId || !z.string().email().safeParse(email).success) {
    return { error: "Email invalide." };
  }

  const bloc = await prisma.bloc.findUnique({
    where: { id: blocId },
    select: { slug: true },
  });
  if (!bloc) return { error: "Bloc introuvable." };

  await prisma.blocInvitation.upsert({
    where: { blocId_email: { blocId, email } },
    create: { blocId, email, token: randomBytes(24).toString("hex") },
    update: {}, // déjà invité : on garde le token existant
  });

  revalidatePath(`/blocs/${bloc.slug}`);
  return {};
}

export async function revoquerInvitation(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (id) await prisma.blocInvitation.delete({ where: { id } }).catch(() => {});
  if (slug) revalidatePath(`/blocs/${slug}`);
}

// ── Suppression d'un bloc ───────────────────────────────────
export async function deleteBloc(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.bloc.delete({ where: { id } }).catch(() => {});
  redirect("/admin");
}
