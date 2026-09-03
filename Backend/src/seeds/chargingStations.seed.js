import ChargingStation from '../models/ChargingStation.js';
import logger from '../utils/logger.js';

const mockStations = [
  {
    name: 'Koramangala Fast Charge Hub',
    address: '80 Feet Rd, 4th Block, Koramangala',
    coordinates: { type: 'Point', coordinates: [77.6271, 12.9352] },
    status: 'AVAILABLE',
    openStatus: 'Open 24/7',
    chargingType: 'Fast Charging',
    speedLabel: '50 kW',
    connector: 'CCS2 / CHAdeMO',
    connectorTypes: ['CCS2', 'CHAdeMO', 'Type 2'],
    pricePerKwh: 18,
    availablePorts: 3,
    totalPorts: 5,
    rating: 4.8,
    amenities: ['Cafe', 'Restroom', 'WiFi'],
    supportedVehicles: ['Ather', 'Ola', 'Nexon EV', 'Tata Tiago EV'],
    paymentMethods: ['RFID', 'App', 'Credit Card'],
    operatingHours: '24 Hours',
    imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80'
  }
];

export const seedChargingStations = async () => {
  try {
    for (const station of mockStations) {
      const exists = await ChargingStation.findOne({ name: station.name });
      if (!exists) {
        await ChargingStation.create(station);
      }
    }
    logger.info('Charging Stations seeded successfully.');
  } catch (error) {
    logger.error(`Error seeding charging stations: ${error.message}`);
  }
};
