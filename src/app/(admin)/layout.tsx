import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <nav className="flex items-center gap-4">
            <Link href="/admin" className="font-semibold">
              Boîte à outils
            </Link>
            <Link href="/blocs/nouveau" className="text-sm text-muted hover:text-white">
              + Nouveau bloc
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="hidden sm:inline">{user.email}</span>
            <form action={logout}>
              <button type="submit" className="hover:text-white">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
