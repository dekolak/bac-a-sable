import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addGuestToken } from "@/lib/guest";

export const dynamic = "force-dynamic";

// Lien magique d'un ami invité : valide le token, ouvre l'accès invité
// (cookie limité à ce bloc), puis renvoie vers l'outil.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const invitation = await prisma.blocInvitation.findUnique({
    where: { token },
    include: { bloc: { select: { slug: true } } },
  });

  if (!invitation) {
    return new Response("Invitation invalide ou révoquée.", { status: 404 });
  }

  await prisma.blocInvitation.update({
    where: { id: invitation.id },
    data: {
      acceptedAt: invitation.acceptedAt ?? new Date(),
      lastAccessAt: new Date(),
    },
  });

  await addGuestToken(token);
  redirect(`/outils/${invitation.bloc.slug}`);
}
