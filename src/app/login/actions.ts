"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Email ou mot de passe invalide." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  // Message générique : on ne révèle pas si l'email existe.
  const ok = user && (await verifyPassword(parsed.data.password, user.passwordHash));
  if (!user || !ok) {
    return { error: "Identifiants incorrects." };
  }

  await createSession(user.id);
  redirect("/admin");
}
