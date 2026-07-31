import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Racine : renvoie vers le tableau de bord si connecté, sinon vers le login.
export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? "/admin" : "/login");
}
