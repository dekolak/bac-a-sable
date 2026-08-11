import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { LanceurClient } from "./lanceur-client";

export const dynamic = "force-dynamic";

export default async function LanceurPage() {
  const user = await requireUser();
  const raccourcis = await prisma.raccourci.findMany({
    where: { ownerId: user.id },
    orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
    select: { id: true, nom: true, url: true, icone: true, couleur: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Mes outils</h1>
      <LanceurClient raccourcis={raccourcis} />
    </div>
  );
}
