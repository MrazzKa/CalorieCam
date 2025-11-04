-- CreateEnum
CREATE TYPE "FoodSource" AS ENUM ('USDA_LOCAL', 'USDA_API');

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "fdc_id" INTEGER NOT NULL,
    "data_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "brand_owner" TEXT,
    "gtin_upc" TEXT,
    "scientific_name" TEXT,
    "published_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "source" "FoodSource" NOT NULL DEFAULT 'USDA_LOCAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_row" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_portions" (
    "id" TEXT NOT NULL,
    "food_id" TEXT NOT NULL,
    "gram_weight" DOUBLE PRECISION NOT NULL,
    "measure_unit" TEXT NOT NULL,
    "modifier" TEXT,
    "amount" DOUBLE PRECISION,

    CONSTRAINT "food_portions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrients" (
    "id" INTEGER NOT NULL,
    "number" TEXT,
    "name" TEXT NOT NULL,
    "unit_name" TEXT NOT NULL,
    "rank" INTEGER,

    CONSTRAINT "nutrients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_nutrients" (
    "id" TEXT NOT NULL,
    "food_id" TEXT NOT NULL,
    "nutrient_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "food_nutrients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "label_nutrients" (
    "food_id" TEXT NOT NULL,
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "carbohydrates" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "sugars" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,
    "cholesterol" DOUBLE PRECISION,
    "potassium" DOUBLE PRECISION,
    "calcium" DOUBLE PRECISION,
    "iron" DOUBLE PRECISION,

    CONSTRAINT "label_nutrients_pkey" PRIMARY KEY ("food_id")
);

-- CreateTable
CREATE TABLE "food_embeddings" (
    "food_id" TEXT NOT NULL,
    "embedding" BYTEA NOT NULL,
    "doc" TEXT NOT NULL,
    "ts" TEXT,

    CONSTRAINT "food_embeddings_pkey" PRIMARY KEY ("food_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "foods_fdc_id_key" ON "foods"("fdc_id");

-- CreateIndex
CREATE UNIQUE INDEX "foods_gtin_upc_key" ON "foods"("gtin_upc");

-- CreateIndex
CREATE INDEX "foods_fdc_id_idx" ON "foods"("fdc_id");

-- CreateIndex
CREATE INDEX "foods_data_type_idx" ON "foods"("data_type");

-- CreateIndex
CREATE INDEX "foods_description_idx" ON "foods"("description");

-- CreateIndex
CREATE INDEX "food_portions_food_id_idx" ON "food_portions"("food_id");

-- CreateIndex
CREATE UNIQUE INDEX "food_nutrients_food_id_nutrient_id_key" ON "food_nutrients"("food_id", "nutrient_id");

-- CreateIndex
CREATE INDEX "food_nutrients_food_id_idx" ON "food_nutrients"("food_id");

-- CreateIndex
CREATE INDEX "food_nutrients_nutrient_id_idx" ON "food_nutrients"("nutrient_id");

-- CreateIndex
CREATE INDEX "food_embeddings_food_id_idx" ON "food_embeddings"("food_id");

-- AddForeignKey
ALTER TABLE "food_portions" ADD CONSTRAINT "food_portions_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_nutrient_id_fkey" FOREIGN KEY ("nutrient_id") REFERENCES "nutrients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "label_nutrients" ADD CONSTRAINT "label_nutrients_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_embeddings" ADD CONSTRAINT "food_embeddings_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create pgvector extension (optional - comment out if not installed)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Note: To use pgvector with Prisma, you'll need to manually run:
-- ALTER TABLE "food_embeddings" ADD COLUMN embedding_vector vector(1536);
-- CREATE INDEX IF NOT EXISTS idx_foodembedding_vec ON "food_embeddings" USING ivfflat ((embedding_vector)) WITH (lists = 100);

-- Create GIN index for tsvector
CREATE INDEX IF NOT EXISTS idx_foodembedding_ts ON "food_embeddings" USING GIN (to_tsvector('simple', doc));

