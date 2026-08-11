-- CreateTable
CREATE TABLE "raccourci" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icone" TEXT NOT NULL DEFAULT '',
    "couleur" TEXT NOT NULL DEFAULT '#2f6fed',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raccourci_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raccourci_owner_id_idx" ON "raccourci"("owner_id");

-- AddForeignKey
ALTER TABLE "raccourci" ADD CONSTRAINT "raccourci_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
