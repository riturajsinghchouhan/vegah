import Vehicle from '../../models/Vehicle.js';
import Zone from '../../models/Zone.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

export const updateVehicleStatus = async (vehicleId, status) => {
  // Only allow manual transitions to AVAILABLE, MAINTENANCE, INACTIVE
  // BOOKED and RESERVED are handled by the booking engine
  if (['BOOKED', 'RESERVED'].includes(status)) {
    throw new BadRequestError(`Cannot manually set status to ${status}`);
  }

  const vehicle = await Vehicle.findOne({ _id: vehicleId, deletedAt: null });
  
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  if (['BOOKED', 'RESERVED'].includes(vehicle.status) && status !== 'AVAILABLE') {
    throw new BadRequestError(`Cannot change status of a ${vehicle.status} vehicle`);
  }

  vehicle.status = status;
  await vehicle.save();

  return vehicle;
};

export const getZoneAvailability = async (zoneId) => {
  const zone = await Zone.findOne({ _id: zoneId, deletedAt: null });
  
  if (!zone) {
    throw new NotFoundError('Zone not found');
  }

  // Aggregate counts by status
  const counts = await Vehicle.aggregate([
    { $match: { zone: zone._id, deletedAt: null } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const availability = {
    AVAILABLE: 0,
    BOOKED: 0,
    RESERVED: 0,
    MAINTENANCE: 0,
    INACTIVE: 0,
    total: 0
  };

  counts.forEach(c => {
    if (availability[c._id] !== undefined) {
      availability[c._id] = c.count;
      availability.total += c.count;
    }
  });

  return { zone, availability };
};

export const getAllZonesAvailability = async () => {
  const counts = await Vehicle.aggregate([
    { $match: { deletedAt: null } },
    { 
      $group: { 
        _id: { zone: '$zone', status: '$status' }, 
        count: { $sum: 1 } 
      } 
    }
  ]);

  // Format data
  const zonesMap = {};
  
  counts.forEach(c => {
    const zoneId = c._id.zone.toString();
    const status = c._id.status;
    
    if (!zonesMap[zoneId]) {
      zonesMap[zoneId] = {
        AVAILABLE: 0, BOOKED: 0, RESERVED: 0, MAINTENANCE: 0, INACTIVE: 0, total: 0
      };
    }
    
    zonesMap[zoneId][status] = c.count;
    zonesMap[zoneId].total += c.count;
  });

  return zonesMap;
};
