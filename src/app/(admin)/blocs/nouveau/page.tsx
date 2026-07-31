import Link from "next/link";
import { NouveauBlocForm } from "./nouveau-form";

export const dynamic = "force-dynamic";

export default function NouveauBlocPage() {
  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-white">
        ← Retour
      </Link>
      <h1 className="mb-6 mt-2 text-lg font-semibold">Nouveau bloc</h1>
      <NouveauBlocForm />
    </div>
  );
}
