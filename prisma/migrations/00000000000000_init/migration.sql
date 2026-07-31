-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BlocVisibilite" AS ENUM ('PUBLIC', 'PRIVE', 'PARTAGE');

-- CreateEnum
CREATE TYPE "BlocStatut" AS ENUM ('BROUILLON', 'TEST', 'PROD');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloc" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL DEFAULT '',
    "visibilite" "BlocVisibilite" NOT NULL DEFAULT 'PRIVE',
    "statut" "BlocStatut" NOT NULL DEFAULT 'BROUILLON',
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloc_donnee" (
    "id" TEXT NOT NULL,
    "bloc_id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloc_donnee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloc_invitation" (
    "id" TEXT NOT NULL,
    "bloc_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "last_access_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloc_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bloc_slug_key" ON "bloc"("slug");

-- CreateIndex
CREATE INDEX "bloc_owner_id_idx" ON "bloc"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "bloc_donnee_bloc_id_cle_key" ON "bloc_donnee"("bloc_id", "cle");

-- CreateIndex
CREATE UNIQUE INDEX "bloc_invitation_token_key" ON "bloc_invitation"("token");

-- CreateIndex
CREATE INDEX "bloc_invitation_bloc_id_idx" ON "bloc_invitation"("bloc_id");

-- CreateIndex
CREATE UNIQUE INDEX "bloc_invitation_bloc_id_email_key" ON "bloc_invitation"("bloc_id", "email");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc" ADD CONSTRAINT "bloc_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_donnee" ADD CONSTRAINT "bloc_donnee_bloc_id_fkey" FOREIGN KEY ("bloc_id") REFERENCES "bloc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_invitation" ADD CONSTRAINT "bloc_invitation_bloc_id_fkey" FOREIGN KEY ("bloc_id") REFERENCES "bloc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

