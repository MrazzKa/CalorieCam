-- Ensure there are no NULL values in body_markdown before making it NOT NULL.
-- This makes the migration safe for existing production data.
UPDATE "articles"
SET "body_markdown" = ''
WHERE "body_markdown" IS NULL;

-- AlterTable
ALTER TABLE "articles"
ALTER COLUMN "body_markdown" SET NOT NULL;

-- CreateTable
CREATE TABLE "user_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total_photos_analyzed" INTEGER NOT NULL DEFAULT 0,
    "today_photos_analyzed" INTEGER NOT NULL DEFAULT 0,
    "last_analysis_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "raw_text" TEXT,
    "summary" TEXT,
    "recommendation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_metrics" (
    "id" TEXT NOT NULL,
    "lab_result_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "is_normal" BOOLEAN NOT NULL DEFAULT true,
    "level" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_userId_key" ON "user_stats"("userId");

-- CreateIndex
CREATE INDEX "lab_results_userId_created_at_idx" ON "lab_results"("userId", "created_at");

-- CreateIndex
CREATE INDEX "lab_metrics_lab_result_id_idx" ON "lab_metrics"("lab_result_id");

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_metrics" ADD CONSTRAINT "lab_metrics_lab_result_id_fkey" FOREIGN KEY ("lab_result_id") REFERENCES "lab_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
