const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDbHealth() {
  try {
    const userCount = await prisma.user.count();
    const farmCount = await prisma.farm.count();
    const yieldCount = await prisma.agroYield.count();
    const postCount = await prisma.post.count();
    const orderCount = await prisma.order.count();

    console.log('✅ Connected to agrom_db successfully!');
    console.log(`- Users: ${userCount}`);
    console.log(`- Farms: ${farmCount}`);
    console.log(`- AgroYields: ${yieldCount}`);
    console.log(`- Posts: ${postCount}`);
    console.log(`- Orders: ${orderCount}`);
  } catch (err) {
    console.error('❌ agrom_db health check error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDbHealth();
