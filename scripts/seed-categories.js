const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIES = [
  {
    name: 'Vegetables & Greens',
    frenchName: 'Légumes & Maraîchers',
    icon: 'leaf',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500',
    description: 'Fresh organic tomatoes, peppers, cabbages, leafy greens from valley farms.',
  },
  {
    name: 'Tubers & Roots',
    frenchName: 'Tubercules & Racines',
    icon: 'sprout',
    imageUrl: 'https://images.unsplash.com/photo-1570723735746-c9bd51bd7c40?w=500',
    description: 'Irish potatoes, sweet cassava, yams, and cocoyams from fertile volcanic soils.',
  },
  {
    name: 'Plantains & Bananas',
    frenchName: 'Bananes & Plantains',
    icon: 'tree-palm',
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500',
    description: 'Heavy bunches of plantains and sweet bananas directly from coastal plantations.',
  },
  {
    name: 'Fruits & Citrus',
    frenchName: 'Fruits & Agrumes',
    icon: 'apple',
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500',
    description: 'Pineapples, papayas, mangoes, avocados, oranges, and fresh passion fruits.',
  },
  {
    name: 'Grains & Cereals',
    frenchName: 'Céréales & Grains',
    icon: 'wheat',
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500',
    description: 'White & yellow maize, Ndop mountain rice, sorghum, and millet.',
  },
  {
    name: 'Legumes, Nuts & Seeds',
    frenchName: 'Légumineuses & Oléagineux',
    icon: 'bean',
    imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500',
    description: 'Red beans, cowpeas, groundnuts (peanuts), egusi melon seeds, and soybeans.',
  },
  {
    name: 'Oils & Fats',
    frenchName: 'Huiles Végétales & Graisses',
    icon: 'droplet',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500',
    description: 'Pure red palm oil, virgin coconut oil, peanut oil, and raw shea butter.',
  },
  {
    name: 'Spices & Aromatics',
    frenchName: 'Épices & Aromates',
    icon: 'flame',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500',
    description: 'Penja white and black pepper, ginger, garlic, cloves, and local spices.',
  },
  {
    name: 'Poultry & Eggs',
    frenchName: 'Volaille & Œufs',
    icon: 'egg',
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500',
    description: 'Farm-fresh table eggs, broiler chickens, local chickens, and turkey.',
  },
  {
    name: 'Livestock & Meat',
    frenchName: 'Élevage & Viandes',
    icon: 'beef',
    imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=500',
    description: 'Pigs, goats, sheep, grass-fed cattle, and pasture-raised rabbits.',
  },
  {
    name: 'Aquaculture & Fish',
    frenchName: 'Pisciculture & Poissons',
    icon: 'fish',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500',
    description: 'Fresh live catfish, tilapia, smoked river fish, and dried sea prawns.',
  },
];

async function seedCategories() {
  console.log('Seeding comprehensive African Agricultural categories...');
  for (const cat of CATEGORIES) {
    const upserted = await prisma.category.upsert({
      where: { name: cat.name },
      update: {
        frenchName: cat.frenchName,
        icon: cat.icon,
        imageUrl: cat.imageUrl,
        description: cat.description,
      },
      create: cat,
    });
    console.log(`- Upserted: ${upserted.name} (${upserted.id})`);
  }
  console.log('✅ All 11 agricultural categories seeded successfully.');
  await prisma.$disconnect();
}

seedCategories().catch((e) => {
  console.error(e);
  process.exit(1);
});
