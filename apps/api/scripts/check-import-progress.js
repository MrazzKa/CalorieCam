const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProgress() {
  try {
    const brandedCount = await prisma.food.count({ where: { dataType: 'Branded' } });
    const allCounts = {
      allFoods: await prisma.food.count(),
      foundation: await prisma.food.count({ where: { dataType: 'Foundation' } }),
      fndds: await prisma.food.count({ where: { dataType: 'Survey (FNDDS)' } }),
      srLegacy: await prisma.food.count({ where: { dataType: 'SR Legacy' } }),
      branded: brandedCount,
    };
    
    console.log('\n=== Import Progress ===');
    console.log(`Foundation: ${allCounts.foundation}`);
    console.log(`FNDDS: ${allCounts.fndds}`);
    console.log(`SR Legacy: ${allCounts.srLegacy}`);
    console.log(`Branded: ${allCounts.branded}`);
    console.log(`Total: ${allCounts.allFoods}`);
    console.log('======================\n');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkProgress();




