import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import logger from '../utils/logger.js';
import { seedAdmin } from './admin.seed.js';
import { seedZones } from './zones.seed.js';
import { seedCategories } from './categories.seed.js';
import { seedVehicles } from './vehicles.seed.js';
import { seedChargingStations } from './chargingStations.seed.js';

dotenv.config();

const runSeeds = async () => {
  try {
    await connectDB();
    logger.info('Running seeds...');

    await seedAdmin();
    await seedZones();
    await seedCategories();
    await seedVehicles();
    await seedChargingStations();

    logger.info('All seeds executed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

runSeeds();
