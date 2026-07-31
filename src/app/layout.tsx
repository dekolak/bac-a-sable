import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boîte à outils",
  description: "Plateforme bac à sable — héberge des petits outils isolés (blocs).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
