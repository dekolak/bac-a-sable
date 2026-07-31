import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "[seed] ADMIN_EMAIL / ADMIN_PASSWORD non définis — aucun admin créé.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash }, // permet de réinitialiser le mot de passe via le seed
  });

  console.log(`[seed] Admin prêt : ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
