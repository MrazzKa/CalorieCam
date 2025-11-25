/*
  Warnings:

  - You are about to drop the column `authorId` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `content_md` on the `articles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug,locale]` on the table `articles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `body_markdown` to the `articles` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "articles_is_published_is_featured_idx";

-- DropIndex
DROP INDEX "articles_slug_idx";

-- DropIndex
DROP INDEX "articles_slug_key";

-- AlterTable
ALTER TABLE "articles" DROP COLUMN "authorId",
DROP COLUMN "content_md",
ADD COLUMN     "author_id" TEXT,
ADD COLUMN     "body_markdown" TEXT NOT NULL,
ADD COLUMN     "hero_image_url" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'ru',
ADD COLUMN     "subtitle" TEXT;

-- CreateIndex
CREATE INDEX "articles_locale_is_active_idx" ON "articles"("locale", "is_active");

-- CreateIndex
CREATE INDEX "articles_is_active_is_featured_idx" ON "articles"("is_active", "is_featured");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_locale_key" ON "articles"("slug", "locale");
