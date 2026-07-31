import type { BlocVisibilite, BlocStatut } from "@prisma/client";

const visibiliteStyles: Record<BlocVisibilite, string> = {
  PUBLIC: "bg-green-500/15 text-green-300",
  PRIVE: "bg-slate-500/15 text-slate-300",
  PARTAGE: "bg-amber-500/15 text-amber-300",
};

const visibiliteLabel: Record<BlocVisibilite, string> = {
  PUBLIC: "Public",
  PRIVE: "Privé",
  PARTAGE: "Partagé",
};

const statutStyles: Record<BlocStatut, string> = {
  BROUILLON: "bg-slate-500/15 text-slate-300",
  TEST: "bg-blue-500/15 text-blue-300",
  PROD: "bg-purple-500/15 text-purple-300",
};

const statutLabel: Record<BlocStatut, string> = {
  BROUILLON: "Brouillon",
  TEST: "Test",
  PROD: "Prod",
};

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${className}`}>
      {children}
    </span>
  );
}

export function VisibiliteBadge({ value }: { value: BlocVisibilite }) {
  return <Chip className={visibiliteStyles[value]}>{visibiliteLabel[value]}</Chip>;
}

export function StatutBadge({ value }: { value: BlocStatut }) {
  return <Chip className={statutStyles[value]}>{statutLabel[value]}</Chip>;
}
