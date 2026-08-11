"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { isHexColor, normaliseUrl } from "@/lib/lanceur";

export type FormState = { error?: string; ok?: boolean };

const schema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis.").max(40),
  url: z.string().trim().min(1, "L'URL est requise.").max(2048),
  icone: z.string().trim().max(16).optional().default(""),
  couleur: z.string().trim().optional().default("#2f6fed"),
});

function couleurValide(c: string | undefined): string {
  return c && isHexColor(c) ? c : "#2f6fed";
}

// Crée (pas d'id) ou met à jour (id présent) un raccourci de l'admin connecté.
export async function saveRaccourci(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  const parsed = schema.safeParse({
    nom: formData.get("nom"),
    url: formData.get("url"),
    icone: formData.get("icone"),
    couleur: formData.get("couleur"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const data = {
    nom: parsed.data.nom,
    url: normaliseUrl(parsed.data.url),
    icone: parsed.data.icone ?? "",
    couleur: couleurValide(parsed.data.couleur),
  };

  if (id) {
    // Scoping par ownerId : on ne touche qu'aux raccourcis de l'admin connecté.
    const res = await prisma.raccourci.updateMany({
      where: { id, ownerId: user.id },
      data,
    });
    if (res.count === 0) return { error: "Raccourci introuvable." };
  } else {
    const max = await prisma.raccourci.aggregate({
      where: { ownerId: user.id },
      _max: { ordre: true },
    });
    await prisma.raccourci.create({
      data: { ...data, ordre: (max._max.ordre ?? 0) + 1, ownerId: user.id },
    });
  }

  revalidatePath("/lanceur");
  return { ok: true };
}

export async function deleteRaccourci(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.raccourci
      .deleteMany({ where: { id, ownerId: user.id } })
      .catch(() => {});
  }
  revalidatePath("/lanceur");
}
