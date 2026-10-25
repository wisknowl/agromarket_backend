const { PrismaClient } = require('c:/Users/PC USER/Desktop/AgroMarket/Backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function reconcileDatabase() {
  console.log('🔄 Starting AgroMarket Farm & Yield Data Reconciliation...');

  // 1. Ensure all FARMER users and Farm owners have a FarmerProfile
  const farmersWithoutProfile = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'FARMER' },
        { farms: { some: {} } }
      ],
      farmerProfile: null
    },
    include: { farms: true }
  });

  console.log(`Found ${farmersWithoutProfile.length} farmer(s) missing FarmerProfile.`);
  for (const u of farmersWithoutProfile) {
    const firstFarm = u.farms[0];
    const createdProfile = await prisma.farmerProfile.create({
      data: {
        userId: u.id,
        farmName: firstFarm ? firstFarm.name : `${u.name}'s Farm`,
        region: firstFarm ? firstFarm.region : 'West Region',
        city: firstFarm ? firstFarm.city : 'Foumbot',
        farmSizeHectares: firstFarm ? firstFarm.sizeHectares : 1.0,
        primaryCrops: firstFarm ? firstFarm.primaryProduce : ['Crops'],
        creditScore: 550,
      }
    });
    console.log(`  ✅ Created FarmerProfile for ${u.name} (Profile ID: ${createdProfile.id})`);
  }

  // 2. Ensure all FarmerProfiles have at least one registered Farm
  const profilesWithoutFarm = await prisma.farmerProfile.findMany({
    where: {
      user: {
        farms: { none: {} }
      }
    },
    include: { user: true }
  });

  console.log(`Found ${profilesWithoutFarm.length} FarmerProfile(s) missing a physical Farm record.`);
  for (const fp of profilesWithoutFarm) {
    const newFarm = await prisma.farm.create({
      data: {
        userId: fp.userId,
        name: fp.farmName || `${fp.user.name}'s Highland Farm`,
        category: 'CROPS',
        region: fp.region || 'Northwest Region',
        city: fp.city || 'Bamenda',
        location: `${fp.city || 'Bamenda'}, ${fp.region || 'Northwest Region'}`,
        sizeHectares: fp.farmSizeHectares || 2.5,
        primaryProduce: fp.primaryCrops.length > 0 ? fp.primaryCrops : ['Coffee', 'Irish Potatoes'],
        certifications: ['Cameroon GAP Verified', 'Volcanic Soil Organic'],
        isVerified: true,
        rating: 4.9,
      }
    });
    console.log(`  ✅ Created Farm "${newFarm.name}" (ID: ${newFarm.id}) for ${fp.user.name}`);

    // If there were yields with this farmerId and farmId: null, link them!
    const linked = await prisma.agroYield.updateMany({
      where: { farmerId: fp.id, farmId: null },
      data: { farmId: newFarm.id }
    });
    console.log(`     🔗 Linked ${linked.count} yield(s) to this new farm.`);
  }

  // 3. Reconcile AgroYields with farmId but farmerId: null
  const yieldsMissingFarmer = await prisma.agroYield.findMany({
    where: { farmerId: null, farmId: { not: null } },
    include: {
      farm: {
        include: {
          user: { include: { farmerProfile: true } }
        }
      }
    }
  });

  console.log(`Found ${yieldsMissingFarmer.length} yield(s) with farmId but missing farmerId.`);
  for (const y of yieldsMissingFarmer) {
    const profileId = y.farm?.user?.farmerProfile?.id;
    if (profileId) {
      await prisma.agroYield.update({
        where: { id: y.id },
        data: { farmerId: profileId }
      });
      console.log(`  ✅ Linked yield "${y.title}" -> farmerId: ${profileId}`);
    }
  }

  // 4. Resolve any remaining yields where both farmId and farmerId were null (orphaned mock seeds)
  const greenValleyFarm = await prisma.farm.findFirst({
    where: { name: { contains: 'Green Valley', mode: 'insensitive' } },
    include: { user: { include: { farmerProfile: true } } }
  });

  if (greenValleyFarm && greenValleyFarm.user.farmerProfile) {
    const totallyOrphaned = await prisma.agroYield.findMany({
      where: {
        OR: [
          { farmId: null },
          { farmerId: null }
        ]
      }
    });

    if (totallyOrphaned.length > 0) {
      console.log(`Reconciling ${totallyOrphaned.length} remaining orphaned yields to primary sample farm "${greenValleyFarm.name}"...`);
      for (const oy of totallyOrphaned) {
        await prisma.agroYield.update({
          where: { id: oy.id },
          data: {
            farmId: greenValleyFarm.id,
            farmerId: greenValleyFarm.user.farmerProfile.id
          }
        });
        console.log(`  ✅ Attached orphaned yield "${oy.title}" -> Farm: ${greenValleyFarm.name}`);
      }
    }
  }

  console.log('\n🎉 Reconciliation complete!');
  await prisma.$disconnect();
}

reconcileDatabase().catch((err) => {
  console.error('Reconciliation failed:', err);
  process.exit(1);
});
