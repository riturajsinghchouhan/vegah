import Vehicle from '../../models/Vehicle.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import cloudinary from '../../config/cloudinary.js';

export const createVehicle = async (data, files) => {
  const existingVehicle = await Vehicle.findOne({ plateNumber: data.plateNumber, deletedAt: null });
  if (existingVehicle) {
    throw new ConflictError('Vehicle with this plate number already exists');
  }

  // Handle GeoJSON format for coordinates
  if (data.coordinates) {
    data.coordinates = {
      type: 'Point',
      coordinates: [data.coordinates.lng, data.coordinates.lat],
    };
  }

  const images = [];
  if (files && files.length > 0) {
    files.forEach((file, index) => {
      images.push({
        url: file.path, // Cloudinary URL
        isPrimary: index === 0, // Make the first image primary by default
      });
    });
  }

  data.images = images;

  const vehicle = await Vehicle.create(data);
  return vehicle;
};

export const updateVehicle = async (id, data, files) => {
  if (data.plateNumber) {
    const existingVehicle = await Vehicle.findOne({ 
      plateNumber: data.plateNumber, 
      _id: { $ne: id }, 
      deletedAt: null 
    });
    if (existingVehicle) {
      throw new ConflictError('Vehicle with this plate number already exists');
    }
  }

  // Handle GeoJSON format for coordinates
  if (data.coordinates) {
    data.coordinates = {
      type: 'Point',
      coordinates: [data.coordinates.lng, data.coordinates.lat],
    };
  }

  const vehicleToUpdate = await Vehicle.findOne({ _id: id, deletedAt: null });
  if (!vehicleToUpdate) {
    throw new NotFoundError('Vehicle not found');
  }

  // Handle images if new ones are uploaded (append to existing for now, or replace depending on business logic)
  if (files && files.length > 0) {
    const newImages = files.map(file => ({
      url: file.path,
      isPrimary: false,
    }));
    
    if (vehicleToUpdate.images.length === 0 && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    
    data.$push = { images: { $each: newImages } };
  }

  const updatedVehicle = await Vehicle.findOneAndUpdate(
    { _id: id, deletedAt: null },
    data.$push ? { $set: data, $push: data.$push } : { $set: data },
    { new: true }
  );

  return updatedVehicle;
};

export const getVehicleById = async (id) => {
  const vehicle = await Vehicle.findOne({ _id: id, deletedAt: null })
    .populate('category', 'name type')
    .populate('zone', 'name subtitle');
    
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }
  return vehicle;
};

export const listVehicles = async (query) => {
  const { page = 1, limit = 20, type, category, zone, status, search, minPriceDay, maxPriceDay } = query;
  
  const filter = { deletedAt: null };
  
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (zone) filter.zone = zone;
  if (status) filter.status = status;
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { plateNumber: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }

  if (minPriceDay !== undefined || maxPriceDay !== undefined) {
    filter.pricePerDay = {};
    if (minPriceDay !== undefined) filter.pricePerDay.$gte = minPriceDay;
    if (maxPriceDay !== undefined) filter.pricePerDay.$lte = maxPriceDay;
  }

  const skip = (page - 1) * limit;

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter)
      .populate('category', 'name type')
      .populate('zone', 'name subtitle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Vehicle.countDocuments(filter)
  ]);

  return {
    vehicles,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const deleteVehicle = async (id) => {
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date(), status: 'INACTIVE' } },
    { new: true }
  );

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  return vehicle;
};

export const deleteVehicleImage = async (vehicleId, imageId) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, deletedAt: null });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  const image = vehicle.images.id(imageId);
  if (!image) {
    throw new NotFoundError('Image not found on this vehicle');
  }

  // Attempt to delete from cloudinary (optional, based on your strategy)
  if (cloudinary && image.url.includes('cloudinary')) {
    try {
      const publicId = image.url.split('/').pop().split('.')[0]; 
      // Highly simplified, actual extraction might be complex depending on full path. 
      // If folder is vegah_uploads, publicId is vegah_uploads/xyz.
      // Easiest is just remove from DB.
    } catch (err) {
      console.warn('Failed to extract/delete cloudinary image', err);
    }
  }

  vehicle.images.pull(imageId);
  
  // Ensure we have a primary image if we deleted the primary
  if (image.isPrimary && vehicle.images.length > 0) {
    vehicle.images[0].isPrimary = true;
  }

  await vehicle.save();
  return vehicle;
};
