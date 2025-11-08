import { PrismaClient } from '@prisma/client';

enum FoodSource {
  USDA_LOCAL = 'USDA_LOCAL',
  USDA_API = 'USDA_API',
}
import * as fs from 'fs';
import * as path from 'path';
const Chain = require('stream-chain');
const StreamValues = require('stream-json/streamers/StreamValues');
import * as z from 'zod';

const prisma = new PrismaClient();

// Zod schemas for validation
const FoodSchema = z.object({
  fdcId: z.number(),
  dataType: z.string(),
  description: z.string(),
  brandOwner: z.string().optional(),
  gtinUpc: z.string().optional(),
  scientificName: z.string().optional(),
  publishedDate: z.string().optional(),
  foodUpdateDate: z.string().optional(),
  foodPortions: z.array(z.any()).optional(),
  foodNutrients: z.array(z.any()).optional(),
  labelNutrients: z.any().optional(),
});

const NutrientSchema = z.object({
  id: z.number(),
  number: z.string().optional(),
  name: z.string(),
  unitName: z.string(),
  rank: z.number().optional(),
});

async function parseArgs() {
  const args = process.argv.slice(2);
  const fileArg = args.find(arg => arg.startsWith('--file='));
  const typeArg = args.find(arg => arg.startsWith('--type='));

  if (!fileArg || !typeArg) {
    throw new Error('Usage: --file=<path> --type=<Branded|Foundation|FNDDS|SRLegacy>');
  }

  return {
    file: fileArg.split('=')[1],
    type: typeArg.split('=')[1],
  };
}

async function seedNutrients() {
  const nutrients = [
    { id: 1003, number: '203', name: 'Protein', unitName: 'G', rank: 600 },
    { id: 1004, number: '204', name: 'Total lipid (fat)', unitName: 'G', rank: 800 },
    { id: 1005, number: '205', name: 'Carbohydrate, by difference', unitName: 'G', rank: 1110 },
    { id: 1008, number: '208', name: 'Energy', unitName: 'KCAL', rank: 300 },
    { id: 1079, number: '269', name: 'Sugars, total including NLEA', unitName: 'G', rank: 1510 },
    { id: 2000, number: '307', name: 'Sodium, Na', unitName: 'MG', rank: 1500 },
    { id: 2047, number: '957', name: 'Energy (Atwater General Factors)', unitName: 'KCAL', rank: null },
    { id: 2048, number: '958', name: 'Energy (Atwater Specific Factors)', unitName: 'KCAL', rank: null },
  ];

  for (const nutrient of nutrients) {
    await prisma.nutrient.upsert({
      where: { id: nutrient.id },
      update: nutrient,
      create: nutrient,
    });
  }

  console.log(`✓ Seeded ${nutrients.length} nutrients`);
}

async function importFood(foodData: any, dataType: string) {
  const validated = FoodSchema.parse(foodData);

  // Upsert Food
  const food = await prisma.food.upsert({
    where: { fdcId: validated.fdcId },
    update: {
      dataType: validated.dataType,
      description: validated.description,
      brandOwner: validated.brandOwner,
      gtinUpc: validated.gtinUpc,
      scientificName: validated.scientificName,
      publishedAt: validated.publishedDate ? new Date(validated.publishedDate) : null,
      updatedAt: validated.foodUpdateDate ? new Date(validated.foodUpdateDate) : null,
      source: FoodSource.USDA_LOCAL,
    },
    create: {
      fdcId: validated.fdcId,
      dataType: validated.dataType,
      description: validated.description,
      brandOwner: validated.brandOwner,
      gtinUpc: validated.gtinUpc,
      scientificName: validated.scientificName,
      publishedAt: validated.publishedDate ? new Date(validated.publishedDate) : null,
      updatedAt: validated.foodUpdateDate ? new Date(validated.foodUpdateDate) : null,
      source: FoodSource.USDA_LOCAL,
    },
  });

  // Upsert portions
  if (validated.foodPortions && validated.foodPortions.length > 0) {
    await prisma.foodPortion.deleteMany({ where: { foodId: food.id } });
    
    await prisma.foodPortion.createMany({
      data: validated.foodPortions.map((p: any) => {
        // Extract measureUnit string from object if needed
        let measureUnitStr = '';
        if (typeof p.measureUnit === 'string') {
          measureUnitStr = p.measureUnit;
        } else if (p.measureUnit && typeof p.measureUnit === 'object') {
          // Use abbreviation if available, otherwise name
          measureUnitStr = p.measureUnit.abbreviation || p.measureUnit.name || '';
        }
        
        return {
          foodId: food.id,
          gramWeight: p.gramWeight || 0,
          measureUnit: measureUnitStr,
          modifier: p.modifier || null,
          amount: p.amount !== null && p.amount !== undefined ? p.amount : null,
        };
      }),
    });
  }

  // Upsert nutrients
  if (validated.foodNutrients && validated.foodNutrients.length > 0) {
    // First, ensure all nutrients exist
    for (const fn of validated.foodNutrients) {
      if (fn.nutrient) {
        const nutrientData = NutrientSchema.parse(fn.nutrient);
        await prisma.nutrient.upsert({
          where: { id: nutrientData.id },
          update: {
            id: nutrientData.id,
            number: nutrientData.number || null,
            name: nutrientData.name,
            unitName: nutrientData.unitName,
            rank: nutrientData.rank || null,
          },
          create: {
            id: nutrientData.id,
            number: nutrientData.number || null,
            name: nutrientData.name,
            unitName: nutrientData.unitName,
            rank: nutrientData.rank || null,
          },
        });
      }
    }

    // Delete existing and create new
    await prisma.foodNutrient.deleteMany({ where: { foodId: food.id } });
    
    await prisma.foodNutrient.createMany({
      data: validated.foodNutrients
        .filter((fn: any) => fn.nutrient && fn.amount !== null && fn.amount !== undefined)
        .map((fn: any) => ({
          foodId: food.id,
          nutrientId: fn.nutrient.id,
          amount: fn.amount || 0,
        })),
    });
  }

  // Upsert label nutrients (only for Branded)
  if (dataType === 'Branded' && validated.labelNutrients) {
    const label = validated.labelNutrients;
    await prisma.labelNutrients.upsert({
      where: { foodId: food.id },
      update: {
        calories: label.calories,
        protein: label.protein,
        fat: label.fat,
        carbohydrates: label.carbohydrates,
        fiber: label.fiber,
        sugars: label.sugars,
        sodium: label.sodium,
        cholesterol: label.cholesterol,
        potassium: label.potassium,
        calcium: label.calcium,
        iron: label.iron,
      },
      create: {
        foodId: food.id,
        calories: label.calories,
        protein: label.protein,
        fat: label.fat,
        carbohydrates: label.carbohydrates,
        fiber: label.fiber,
        sugars: label.sugars,
        sodium: label.sodium,
        cholesterol: label.cholesterol,
        potassium: label.potassium,
        calcium: label.calcium,
        iron: label.iron,
      },
    });
  }

  return food;
}

async function main() {
  try {
    const { file, type } = await parseArgs();
    
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }

    console.log(`Starting import: ${file} (type: ${type})`);

    // Seed nutrients first
    await seedNutrients();

    // Check if already ingested
    const ingestedDir = path.resolve(process.env.USDA_DATA_DIR || './data/usda/raw', '../ingested');
    const basename = path.basename(file);
    const markerFile = path.join(ingestedDir, `${basename}.done`);
    
    if (fs.existsSync(markerFile)) {
      console.log(`⚠ File already ingested: ${basename}`);
      return;
    }

    // Ensure ingested directory exists
    if (!fs.existsSync(ingestedDir)) {
      fs.mkdirSync(ingestedDir, { recursive: true });
    }

    let count = 0;
    let batch: any[] = [];
    const BATCH_SIZE = 500;

    const pipeline = new Chain([
      fs.createReadStream(file),
      StreamValues.withParser(),
    ]);

    pipeline.on('data', async (data: any) => {
      const value = data?.value;
      
      if (!value || typeof value !== 'object') {
        return;
      }
      
      // Extract array based on data type
      let foodsArray: any[] = [];
      
      if (type === 'Foundation' && value.FoundationFoods && Array.isArray(value.FoundationFoods)) {
        foodsArray = value.FoundationFoods;
      } else if (type === 'FNDDS' && value.FNDDS && Array.isArray(value.FNDDS)) {
        foodsArray = value.FNDDS;
      } else if (type === 'SRLegacy' && value.SRLegacy && Array.isArray(value.SRLegacy)) {
        foodsArray = value.SRLegacy;
      } else if (type === 'Branded' && value.BrandedFoods && Array.isArray(value.BrandedFoods)) {
        foodsArray = value.BrandedFoods;
      } else if (Array.isArray(value)) {
        foodsArray = value;
      } else if (value.fdcId || value.fdc_id) {
        foodsArray = [value];
      } else {
        return;
      }
      
      // Process each food in the array
      for (const foodData of foodsArray) {
        if (foodData && typeof foodData === 'object' && (foodData.fdcId || foodData.fdc_id)) {
          if (!foodData.fdcId && foodData.fdc_id) {
            foodData.fdcId = foodData.fdc_id;
          }
          
          batch.push(foodData);
          
          if (batch.length >= BATCH_SIZE) {
            const batchCopy = [...batch];
            batch = [];
            
            for (const foodItem of batchCopy) {
              try {
                await importFood(foodItem, type);
                count++;
                
                if (count % 100 === 0) {
                  console.log(`  Processed ${count} foods...`);
                }
              } catch (error: any) {
                const fdcId = foodItem?.fdcId || foodItem?.fdc_id || 'unknown';
                console.error(`Error importing food ${fdcId}:`, error.message);
              }
            }
          }
        }
      }
    });

    pipeline.on('end', async () => {
      // Process remaining batch
      for (const foodData of batch) {
        try {
          await importFood(foodData, type);
          count++;
        } catch (error: any) {
          console.error(`Error importing food ${foodData.fdcId}:`, error.message);
        }
      }

      // Write marker file
      fs.writeFileSync(markerFile, new Date().toISOString());
      
      console.log(`\n✓ Import complete: ${count} foods imported`);
      console.log(`✓ Marker file created: ${markerFile}`);
      
      await prisma.$disconnect();
      process.exit(0);
    });

    pipeline.on('error', (error: Error) => {
      console.error('Pipeline error:', error);
      process.exit(1);
    });
  } catch (error: any) {
    console.error('Import error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();

