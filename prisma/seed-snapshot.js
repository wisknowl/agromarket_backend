const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function sanitizeJsonFields(rows, jsonKeys = []) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return rows.map((row) => {
    const copy = { ...row };
    for (const key of jsonKeys) {
      if (copy[key] === null) {
        delete copy[key];
      }
    }
    return copy;
  });
}

async function main() {
  const snapshotPath = path.join(__dirname, 'snapshot.json');
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot file not found at ${snapshotPath}`);
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  console.log(`🌱 Seeding database from snapshot exported at ${snapshot.exportedAt}...`);

  const steps = [
    { name: 'users', fn: () => prisma.user.createMany({ data: snapshot.users || [], skipDuplicates: true }), count: snapshot.users?.length || 0 },
    { name: 'categories', fn: () => prisma.category.createMany({ data: snapshot.categories || [], skipDuplicates: true }), count: snapshot.categories?.length || 0 },
    { name: 'farmerProfiles', fn: () => prisma.farmerProfile.createMany({ data: snapshot.farmerProfiles || [], skipDuplicates: true }), count: snapshot.farmerProfiles?.length || 0 },
    { name: 'wholesalerProfiles', fn: () => prisma.wholesalerProfile.createMany({ data: snapshot.wholesalerProfiles || [], skipDuplicates: true }), count: snapshot.wholesalerProfiles?.length || 0 },
    { name: 'transporterProfiles', fn: () => prisma.transporterProfile.createMany({ data: snapshot.transporterProfiles || [], skipDuplicates: true }), count: snapshot.transporterProfiles?.length || 0 },
    { name: 'financialProfiles', fn: () => prisma.financialProfile.createMany({ data: snapshot.financialProfiles || [], skipDuplicates: true }), count: snapshot.financialProfiles?.length || 0 },
    { name: 'farms', fn: () => prisma.farm.createMany({ data: sanitizeJsonFields(snapshot.farms, ['parcels']), skipDuplicates: true }), count: snapshot.farms?.length || 0 },
    { name: 'stores', fn: () => prisma.store.createMany({ data: sanitizeJsonFields(snapshot.stores, ['sites']), skipDuplicates: true }), count: snapshot.stores?.length || 0 },
    { name: 'agroYields', fn: () => prisma.agroYield.createMany({ data: snapshot.agroYields || [], skipDuplicates: true }), count: snapshot.agroYields?.length || 0 },
    { name: 'yieldPricingTiers', fn: () => prisma.yieldPricingTier.createMany({ data: snapshot.yieldPricingTiers || [], skipDuplicates: true }), count: snapshot.yieldPricingTiers?.length || 0 },
    { name: 'posts', fn: () => prisma.post.createMany({ data: snapshot.posts || [], skipDuplicates: true }), count: snapshot.posts?.length || 0 },
    { name: 'postLikes', fn: () => prisma.postLike.createMany({ data: snapshot.postLikes || [], skipDuplicates: true }), count: snapshot.postLikes?.length || 0 },
    { name: 'postComments', fn: () => prisma.postComment.createMany({ data: snapshot.postComments || [], skipDuplicates: true }), count: snapshot.postComments?.length || 0 },
    { name: 'cartItems', fn: () => prisma.cartItem.createMany({ data: snapshot.cartItems || [], skipDuplicates: true }), count: snapshot.cartItems?.length || 0 },
    { name: 'orders', fn: () => prisma.order.createMany({ data: snapshot.orders || [], skipDuplicates: true }), count: snapshot.orders?.length || 0 },
    { name: 'orderItems', fn: () => prisma.orderItem.createMany({ data: snapshot.orderItems || [], skipDuplicates: true }), count: snapshot.orderItems?.length || 0 },
    { name: 'escrowRecords', fn: () => prisma.escrowRecord.createMany({ data: snapshot.escrowRecords || [], skipDuplicates: true }), count: snapshot.escrowRecords?.length || 0 },
    { name: 'deliveryTrips', fn: () => prisma.deliveryTrip.createMany({ data: snapshot.deliveryTrips || [], skipDuplicates: true }), count: snapshot.deliveryTrips?.length || 0 },
    { name: 'loanProducts', fn: () => prisma.loanProduct.createMany({ data: snapshot.loanProducts || [], skipDuplicates: true }), count: snapshot.loanProducts?.length || 0 },
    { name: 'loanApplications', fn: () => prisma.loanApplication.createMany({ data: snapshot.loanApplications || [], skipDuplicates: true }), count: snapshot.loanApplications?.length || 0 },
    { name: 'farmerCreditAuditSnapshots', fn: () => prisma.farmerCreditAuditSnapshot.createMany({ data: sanitizeJsonFields(snapshot.farmerCreditAuditSnapshots, ['metricsSnapshot']), skipDuplicates: true }), count: snapshot.farmerCreditAuditSnapshots?.length || 0 },
    { name: 'conversations', fn: () => prisma.conversation.createMany({ data: snapshot.conversations || [], skipDuplicates: true }), count: snapshot.conversations?.length || 0 },
    { name: 'messages', fn: () => prisma.message.createMany({ data: snapshot.messages || [], skipDuplicates: true }), count: snapshot.messages?.length || 0 },
    { name: 'reviews', fn: () => prisma.review.createMany({ data: snapshot.reviews || [], skipDuplicates: true }), count: snapshot.reviews?.length || 0 },
    { name: 'savedYields', fn: () => prisma.savedYield.createMany({ data: snapshot.savedYields || [], skipDuplicates: true }), count: snapshot.savedYields?.length || 0 },
    { name: 'follows', fn: () => prisma.follow.createMany({ data: snapshot.follows || [], skipDuplicates: true }), count: snapshot.follows?.length || 0 },
  ];

  for (const step of steps) {
    if (step.count > 0) {
      const res = await step.fn();
      console.log(`  ✅ ${step.name}: inserted ${res.count} / ${step.count} records`);
    }
  }

  console.log('🎉 Database snapshot seed completed successfully!');
}

main()
  .catch((err) => {
    console.error('❌ Snapshot seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
