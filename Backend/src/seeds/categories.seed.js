import Category from '../models/Category.js';
import logger from '../utils/logger.js';

const categories = [
  { name: 'Scoots', type: 'Two-Wheeler', basePricePerKm: 5, basePricePerMin: 1 },
  { name: 'Bikes', type: 'Two-Wheeler', basePricePerKm: 6, basePricePerMin: 1.5 },
];

export const seedCategories = async () => {
  try {
    for (const category of categories) {
      const exists = await Category.findOne({ name: category.name });
      if (!exists) {
        await Category.create(category);
      }
    }
    logger.info('Categories seeded successfully.');
  } catch (error) {
    logger.error(`Error seeding categories: ${error.message}`);
  }
};
