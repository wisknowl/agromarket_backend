const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportAll() {
  console.log('📦 Exporting snapshot from local PostgreSQL database...');

  const snapshot = {
    exportedAt: new Date().toISOString(),
    users: await prisma.user.findMany(),
    categories: await prisma.category.findMany(),
    farmerProfiles: await prisma.farmerProfile.findMany(),
    wholesalerProfiles: await prisma.wholesalerProfile.findMany(),
    transporterProfiles: await prisma.transporterProfile.findMany(),
    financialProfiles: await prisma.financialProfile.findMany(),
    farms: await prisma.farm.findMany(),
    stores: await prisma.store.findMany(),
    agroYields: await prisma.agroYield.findMany(),
    yieldPricingTiers: await prisma.yieldPricingTier.findMany(),
    posts: await prisma.post.findMany(),
    postLikes: await prisma.postLike.findMany(),
    postComments: await prisma.postComment.findMany(),
    cartItems: await prisma.cartItem.findMany(),
    orders: await prisma.order.findMany(),
    orderItems: await prisma.orderItem.findMany(),
    escrowRecords: await prisma.escrowRecord.findMany(),
    deliveryTrips: await prisma.deliveryTrip.findMany(),
    loanProducts: await prisma.loanProduct.findMany(),
    loanApplications: await prisma.loanApplication.findMany(),
    farmerCreditAuditSnapshots: await prisma.farmerCreditAuditSnapshot.findMany(),
    conversations: await prisma.conversation.findMany(),
    messages: await prisma.message.findMany(),
    reviews: await prisma.review.findMany(),
    savedYields: await prisma.savedYield.findMany(),
    follows: await prisma.follow.findMany(),
  };

  const outPath = path.join(__dirname, '..', 'prisma', 'snapshot.json');
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf8');

  const stats = Object.entries(snapshot)
    .filter(([k]) => k !== 'exportedAt')
    .map(([k, v]) => `  - ${k}: ${v.length}`)
    .join('\n');

  console.log(`✅ Snapshot exported successfully to ${outPath}\n${stats}`);
}

exportAll()
  .catch((err) => {
    console.error('❌ Snapshot export failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
