import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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

  console.log('Seeding nutrients...');

  for (const nutrient of nutrients) {
    // Use raw SQL to insert/update
    const numberVal = nutrient.number ? `'${nutrient.number.replace(/'/g, "''")}'` : 'NULL';
    const rankVal = nutrient.rank !== null && nutrient.rank !== undefined ? nutrient.rank : 'NULL';
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO nutrients (id, number, name, unit_name, rank)
      VALUES (${nutrient.id}, ${numberVal}, '${nutrient.name.replace(/'/g, "''")}', '${nutrient.unitName}', ${rankVal})
      ON CONFLICT (id) 
      DO UPDATE SET 
        number = EXCLUDED.number,
        name = EXCLUDED.name,
        unit_name = EXCLUDED.unit_name,
        rank = EXCLUDED.rank
    `);
  }

  console.log(`✓ Seeded ${nutrients.length} nutrients`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

