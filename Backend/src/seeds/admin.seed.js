import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

export const seedAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin@vegah.com' });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123', 12);
      await Admin.create({
        fullName: 'Super Admin',
        email: 'admin@vegah.com',
        passwordHash,
        role: 'SUPER_ADMIN',
      });
      logger.info('Super Admin seeded successfully. (admin@vegah.com / admin123)');
    } else {
      logger.info('Super Admin already exists.');
    }
  } catch (error) {
    logger.error(`Error seeding admin: ${error.message}`);
  }
};
