import ChargingStation from '../../models/ChargingStation.js';
import { NotFoundError } from '../../utils/errors.js';

export const listChargingStations = async (query = {}) => {
  const { page = 1, limit = 50, status, chargingType, lat, lng, maxDistance = 10000 } = query;
  const filter = {};

  if (status) filter.status = status.toUpperCase();
  if (chargingType) filter.chargingType = chargingType;

  let queryBuilder;

  // If coordinates provided, use geo-near query
  if (lat && lng) {
    queryBuilder = ChargingStation.find({
      ...filter,
      coordinates: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance),
        },
      },
    });
  } else {
    queryBuilder = ChargingStation.find(filter).sort({ createdAt: -1 });
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [stations, total] = await Promise.all([
    queryBuilder.skip(skip).limit(Number(limit)),
    ChargingStation.countDocuments(filter),
  ]);

  return {
    stations,
    meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) || 1 },
  };
};

export const getChargingStationById = async (id) => {
  const station = await ChargingStation.findById(id);
  if (!station) throw new NotFoundError('Charging station not found');
  return station;
};

export const createChargingStation = async (data) => {
  const station = new ChargingStation(data);
  return await station.save();
};

export const updateChargingStation = async (id, data) => {
  const station = await ChargingStation.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!station) throw new NotFoundError('Charging station not found');
  return station;
};

export const deleteChargingStation = async (id) => {
  const station = await ChargingStation.findByIdAndDelete(id);
  if (!station) throw new NotFoundError('Charging station not found');
  return true;
};
