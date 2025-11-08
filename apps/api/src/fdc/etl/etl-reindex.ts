import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIM = parseInt(process.env.EMBEDDING_DIM || '1536', 10);
const BATCH_SIZE = 256;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getEmbeddings(texts: string[], retries = 3): Promise<number[][]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error: any) {
      if (error.status === 429 && attempt < retries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
        console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to get embeddings after retries');
}

async function updateSearchVector(foodId: string, doc: string): Promise<void> {
  // Update search_vector directly using executeRaw (no return value, avoids tsvector deserialization)
  const escapedDoc = doc.replace(/'/g, "''");
  const escapedFoodId = foodId.replace(/'/g, "''");
  await prisma.$executeRawUnsafe(
    `UPDATE foods SET search_vector = to_tsvector('simple', '${escapedDoc}') WHERE id = '${escapedFoodId}'`
  );
}

async function main() {
  try {
    console.log('Starting reindexing...');
    console.log(`Model: ${EMBEDDING_MODEL}, Dimension: ${EMBEDDING_DIM}`);

    // Get all foods without embeddings (exclude Branded - they use lazy cache)
    // Use Prisma client to get foods (it handles column mapping automatically)
    const allFoods = await prisma.food.findMany({
      where: {
        embedding: null,
        dataType: {
          not: 'Branded', // Skip Branded foods - they use lazy cache strategy
        },
      },
      take: 10000,
      select: {
        id: true,
        fdcId: true,
        description: true,
        dataType: true,
        brandOwner: true,
        scientificName: true,
      },
    });
    
    const foods = allFoods;

    console.log(`Found ${foods.length} foods to index`);

    let processed = 0;

    for (let i = 0; i < foods.length; i += BATCH_SIZE) {
      const batch = foods.slice(i, i + BATCH_SIZE);
      
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(foods.length / BATCH_SIZE)}...`);

      // Create documents
      const docs = batch.map(food => {
        const parts = [
          food.description,
          food.brandOwner,
          food.scientificName,
          food.dataType,
        ].filter(Boolean);
        
        return parts.join(' ');
      });

      // Get embeddings
      let embeddings: number[][];
      try {
        embeddings = await getEmbeddings(docs);
      } catch (error: any) {
        console.error(`Error getting embeddings for batch:`, error.message);
        // Skip this batch and continue
        continue;
      }

      // Process each food in batch
      for (let j = 0; j < batch.length; j++) {
        const food = batch[j];
        const embedding = embeddings[j];
        const doc = docs[j];

        if (!embedding || embedding.length !== EMBEDDING_DIM) {
          console.error(`Invalid embedding for food ${food.fdcId}`);
          continue;
        }

        // Update search_vector in foods table (tsvector is handled by trigger, but we update it here for reindex)
        try {
          await updateSearchVector(food.id, doc);
        } catch (error: any) {
          console.error(`Error updating search_vector for food ${food.fdcId}:`, error.message);
        }

        // Convert embedding to Buffer
        const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);

        // Upsert embedding using Prisma client (ts is stored in foods.search_vector, not here)
        await prisma.foodEmbedding.upsert({
          where: { foodId: food.id },
          update: {
            embedding: embeddingBuffer,
            doc,
          },
          create: {
            foodId: food.id,
            embedding: embeddingBuffer,
            doc,
          },
        });

        processed++;
      }

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < foods.length) {
        await sleep(100);
      }
    }

    // Note: pgvector extension requires manual installation
    // For now, we'll store as Bytes and use raw SQL for searches
    console.log('✓ Embeddings stored. Note: pgvector index requires manual setup if needed.');

    // Create GIN index for tsvector (if not exists)
    // Note: Prisma maps table names, so we need to use the actual table name from schema
    try {
      // Use actual table name from Prisma schema mapping
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS idx_foodembedding_ts 
         ON food_embeddings USING GIN (to_tsvector('simple', doc))`
      );
      console.log('✓ Created/verified tsvector index');
    } catch (error: any) {
      console.warn('Could not create tsvector index (may already exist):', error.message);
    }

    console.log(`\n✓ Reindexing complete: ${processed} foods indexed`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('Reindexing error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();

