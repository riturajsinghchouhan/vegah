import User from '../../models/User.js';
import { NotFoundError } from '../../utils/errors.js';

export const listUsers = async (query) => {
  const { page = 1, limit = 20, isVerified, isBlocked, search } = query;
  
  const filter = {};
  
  if (isVerified !== undefined) filter.isVerified = isVerified;
  if (isBlocked !== undefined) filter.isBlocked = isBlocked;
  
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  return {
    users,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
};

export const blockUser = async (id) => {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { isBlocked: true } },
    { new: true }
  );
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
};

export const unblockUser = async (id) => {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { isBlocked: false } },
    { new: true }
  );
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
};

export const updateProfile = async (id, data) => {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  );
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
};

import Document from '../../models/Document.js';
import { BadRequestError } from '../../utils/errors.js';

export const uploadDocument = async (userId, data, file) => {
  if (!file) {
    throw new BadRequestError('File is required');
  }

  // Find existing document of this type for user
  const existingDoc = await Document.findOne({ user: userId, type: data.type });

  let document;
  if (existingDoc) {
    // Optionally delete old file from Cloudinary here
    existingDoc.fileUrl = file.path;
    existingDoc.documentNumber = data.documentNumber || existingDoc.documentNumber;
    existingDoc.verificationStatus = 'PENDING';
    document = await existingDoc.save();
  } else {
    document = await Document.create({
      user: userId,
      type: data.type,
      documentNumber: data.documentNumber,
      fileUrl: file.path,
    });
  }

  return document;
};

export const getUserDocuments = async (userId) => {
  return await Document.find({ user: userId });
};
