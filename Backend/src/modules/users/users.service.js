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
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter)
  ]);

  // Fetch wallet balances and bookings for these users
  const userIds = users.map(u => u._id);
  
  const { default: Wallet } = await import('../../models/Wallet.js');
  const { default: Booking } = await import('../../models/Booking.js');

  const [wallets, bookings] = await Promise.all([
    Wallet.find({ user: { $in: userIds } }).lean(),
    Booking.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: {
          _id: '$user',
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          activeBookings: { 
            $sum: { $cond: [{ $in: ['$status', ['CONFIRMED', 'ACTIVE']] }, 1, 0] } 
          }
      }}
    ])
  ]);

  const walletMap = wallets.reduce((acc, w) => { acc[w.user] = w.balance; return acc; }, {});
  const bookingMap = bookings.reduce((acc, b) => { acc[b._id] = b; return acc; }, {});

  const enrichedUsers = users.map(u => ({
    ...u,
    walletBalance: walletMap[u._id] || 0,
    stats: {
      totalBookings: bookingMap[u._id]?.totalBookings || 0,
      totalSpent: bookingMap[u._id]?.totalSpent || 0,
      activeBookings: bookingMap[u._id]?.activeBookings || 0,
    }
  }));

  return {
    users: enrichedUsers,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (id) => {
  const user = await User.findById(id).lean();
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const { default: Wallet } = await import('../../models/Wallet.js');
  const { default: Booking } = await import('../../models/Booking.js');

  const [wallet, bookingStats] = await Promise.all([
    Wallet.findOne({ user: id }).lean(),
    Booking.aggregate([
      { $match: { user: user._id } }, // use user._id Object
      { $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          activeBookings: { 
            $sum: { $cond: [{ $in: ['$status', ['CONFIRMED', 'ACTIVE']] }, 1, 0] } 
          }
      }}
    ])
  ]);

  return {
    ...user,
    walletBalance: wallet?.balance || 0,
    stats: {
      totalBookings: bookingStats[0]?.totalBookings || 0,
      totalSpent: bookingStats[0]?.totalSpent || 0,
      activeBookings: bookingStats[0]?.activeBookings || 0,
    }
  };
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

export const updateKycDetails = async (id, kycData) => {
  const updateObj = {};
  
  // Directly set the nested properties to avoid Mongoose subdocument spread issues
  for (const key in kycData) {
    if (kycData[key] !== undefined) {
      updateObj[`kycDetails.${key}`] = kycData[key];
    }
  }
  
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { $set: updateObj },
    { new: true }
  );
  
  if (!updatedUser) {
    throw new NotFoundError('User not found');
  }
  
  return updatedUser;
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

import Notification from '../../models/Notification.js';

/**
 * In-app notification feed. Rental reminders are persisted as well as pushed,
 * so a user who had the app closed still sees that their rental was expiring.
 */
export const listNotifications = async (userId, { limit = 30, unreadOnly = false } = {}) => {
  const filter = { user: userId };
  if (unreadOnly) filter.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return { notifications, unreadCount };
};

export const markNotificationsRead = async (userId, ids) => {
  const filter = { user: userId, isRead: false };
  if (Array.isArray(ids) && ids.length) filter._id = { $in: ids };

  const result = await Notification.updateMany(filter, { $set: { isRead: true } });
  return { updated: result.modifiedCount ?? result.nModified ?? 0 };
};
