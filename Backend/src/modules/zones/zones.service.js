import Zone from '../../models/Zone.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export const createZone = async (data) => {
  const existingZone = await Zone.findOne({ name: data.name, deletedAt: null });
  if (existingZone) {
    throw new ConflictError('Zone with this name already exists');
  }

  const zone = await Zone.create(data);
  return zone;
};

export const updateZone = async (id, data) => {
  if (data.name) {
    const existingZone = await Zone.findOne({ name: data.name, _id: { $ne: id }, deletedAt: null });
    if (existingZone) {
      throw new ConflictError('Zone with this name already exists');
    }
  }

  const zone = await Zone.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: data },
    { new: true }
  );

  if (!zone) {
    throw new NotFoundError('Zone not found');
  }

  return zone;
};

export const getZoneById = async (id) => {
  const zone = await Zone.findOne({ _id: id, deletedAt: null });
  if (!zone) {
    throw new NotFoundError('Zone not found');
  }
  return zone;
};

export const listZones = async (query) => {
  const { page = 1, limit = 20, status, search } = query;
  
  const filter = { deletedAt: null };
  
  if (status) {
    filter.status = status;
  }
  
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [zones, total] = await Promise.all([
    Zone.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Zone.countDocuments(filter)
  ]);

  return {
    zones,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const deleteZone = async (id) => {
  const zone = await Zone.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date(), status: 'INACTIVE' } },
    { new: true }
  );

  if (!zone) {
    throw new NotFoundError('Zone not found');
  }

  return zone;
};
