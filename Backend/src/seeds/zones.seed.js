import Zone from '../models/Zone.js';
import logger from '../utils/logger.js';

const zones = [
  { name: 'Koramangala Hub', subtitle: 'Near Forum Mall', unit: 'kilometer', status: 'ACTIVE' },
  { name: 'Indiranagar Hub', subtitle: '100ft Road', unit: 'kilometer', status: 'ACTIVE' },
  { name: 'HSR Layout Hub', subtitle: 'Sector 3', unit: 'kilometer', status: 'ACTIVE' },
];

export const seedZones = async () => {
  try {
    for (const zone of zones) {
      const exists = await Zone.findOne({ name: zone.name });
      if (!exists) {
        await Zone.create(zone);
      }
    }
    logger.info('Zones seeded successfully.');
  } catch (error) {
    logger.error(`Error seeding zones: ${error.message}`);
  }
};
