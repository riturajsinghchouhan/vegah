import Vehicle from '../models/Vehicle.js';
import Category from '../models/Category.js';
import Zone from '../models/Zone.js';
import logger from '../utils/logger.js';

const mockVehicles = [
  {
    plateNumber: 'KA-01-EV-1234',
    name: 'Ather 450X',
    brand: 'Ather',
    model: '450X Gen 3',
    type: 'Scoots',
    rangeKm: 105,
    batteryCapacity: '3.7 kWh',
    chargeTime: '4h 30m',
    chargingInfo: 'Fast charging enabled (80% in 45 mins)',
    seats: 2,
    features: ['Fast charging', 'Bluetooth connection', 'GPS Navigation'],
    location: 'Koramangala, Bengaluru',
    coordinates: { type: 'Point', coordinates: [77.6271, 12.9352] },
    pickupNote: 'Parked in Basement 2, Pillar B4',
    pricePerHour: 50,
    pricePerDay: 400,
    securityDeposit: 1000,
    rating: 4.8,
    reviewsCount: 124,
    images: [{ url: 'https://images.unsplash.com/photo-1620802051772-55a0201f3e7a?auto=format&fit=crop&q=80', isPrimary: true }]
  },
  {
    plateNumber: 'KA-03-EV-5678',
    name: 'Ola S1 Pro',
    brand: 'Ola',
    model: 'S1 Pro Gen 2',
    type: 'Scoots',
    rangeKm: 181,
    batteryCapacity: '4.0 kWh',
    chargeTime: '6h 30m',
    chargingInfo: 'Hypercharge network compatible',
    seats: 2,
    features: ['Cruise control', 'Keyless unlock', 'Large boot space'],
    location: 'Indiranagar, Bengaluru',
    coordinates: { type: 'Point', coordinates: [77.6412, 12.9716] },
    pickupNote: 'Parked outside Metro Station Gate B',
    pricePerHour: 60,
    pricePerDay: 450,
    securityDeposit: 1200,
    rating: 4.6,
    reviewsCount: 89,
    images: [{ url: 'https://images.unsplash.com/photo-1659242966840-0cb79e73fc5f?auto=format&fit=crop&q=80', isPrimary: true }]
  }
];

export const seedVehicles = async () => {
  try {
    const category = await Category.findOne({ name: 'Scoots' });
    const zone = await Zone.findOne({ name: 'Koramangala Hub' });

    if (!category || !zone) {
      logger.warn('Seed Vehicles: Category or Zone not found, skipping...');
      return;
    }

    for (const vData of mockVehicles) {
      const exists = await Vehicle.findOne({ plateNumber: vData.plateNumber });
      if (!exists) {
        await Vehicle.create({
          ...vData,
          category: category._id,
          zone: zone._id,
        });
      }
    }
    logger.info('Vehicles seeded successfully.');
  } catch (error) {
    logger.error(`Error seeding vehicles: ${error.message}`);
  }
};
