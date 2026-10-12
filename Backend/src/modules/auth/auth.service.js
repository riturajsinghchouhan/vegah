import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../../models/User.js';
import redisClient from '../../config/redis.js';
import sms from '../../config/sms.js';
import env from '../../config/env.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

// Helper to generate tokens
const generateTokens = (user) => {
  const payload = {
    id: user._id,
    role: 'USER',
    phone: user.phone,
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });
  
  return { accessToken, refreshToken };
};

// Test phone numbers configured for default OTP login
const TEST_PHONE_NUMBERS = ['9755633147', '+919755633147'];
const DEFAULT_TEST_OTP = '1234';

const isTestPhone = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.toString().trim();
  const digitsOnly = cleanPhone.replace(/^\+91/, '');
  return TEST_PHONE_NUMBERS.includes(cleanPhone) || TEST_PHONE_NUMBERS.includes(digitsOnly);
};

// In-memory store fallback for OTP when Redis is disabled
const memoryOtpStore = new Map();

export const requestOtp = async (phone) => {
  // Check rate limit in Redis manually if needed, but we have middleware for it
  const isTest = isTestPhone(phone);
  let otp;
  if (env.USE_DEFAULT_OTP || isTest) {
    otp = DEFAULT_TEST_OTP;
  } else {
    otp = Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Hash OTP before storing (basic security measure)
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  // Store in Redis with TTL or use memory store fallback
  if (env.REDIS_ENABLED && redisClient) {
    const key = `otp:${phone}`;
    await redisClient.setex(key, env.OTP_EXPIRY_SECONDS, hashedOtp);
  } else {
    const key = `otp:${phone}`;
    memoryOtpStore.set(key, hashedOtp);
    setTimeout(() => {
      memoryOtpStore.delete(key);
    }, env.OTP_EXPIRY_SECONDS * 1000);
  }

  // Send OTP (bypass SMS sending for test numbers or when default OTP is enabled)
  if (!env.USE_DEFAULT_OTP && !isTest) {
    await sms.sendOTP(phone, otp);
  }

  return { message: 'OTP sent successfully' };
};

export const verifyOtp = async (phone, otp) => {
  const isTest = isTestPhone(phone);
  const isMasterOtp = isTest && otp === DEFAULT_TEST_OTP;
  const key = `otp:${phone}`;
  let storedHashedOtp;

  if (!isMasterOtp) {
    if (env.REDIS_ENABLED && redisClient) {
      storedHashedOtp = await redisClient.get(key);
    } else {
      storedHashedOtp = memoryOtpStore.get(key);
    }

    if (!storedHashedOtp) {
      throw new BadRequestError('OTP has expired or is invalid');
    }

    const hashedInputOtp = crypto.createHash('sha256').update(otp).digest('hex');

    if (hashedInputOtp !== storedHashedOtp) {
      throw new BadRequestError('Invalid OTP');
    }
  }

  // Clear OTP
  if (env.REDIS_ENABLED && redisClient) {
    await redisClient.del(key);
  } else {
    memoryOtpStore.delete(key);
  }

  // Find or create user
  let user = await User.findOne({ phone });
  let isNewUser = false;

  if (!user) {
    user = await User.create({
      phone,
      fullName: `User ${phone.slice(-4)}`, // Placeholder
      isVerified: true,
    });
    isNewUser = true;
  } else {
    if (user.isBlocked) {
      throw new UnauthorizedError('Your account has been blocked');
    }
    user.lastLoginAt = new Date();
    user.isVerified = true;
    await user.save();
  }

  const { accessToken, refreshToken } = generateTokens(user);

  // Store refresh token hash in DB
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  user.refreshTokenHash = refreshTokenHash;
  await user.save();

  return { accessToken, refreshToken, user, isNewUser };
};

export const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshTokenHash');

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.isBlocked) {
      throw new UnauthorizedError('Your account has been blocked');
    }

    const hashedInputToken = crypto.createHash('sha256').update(token).digest('hex');
    
    if (user.refreshTokenHash !== hashedInputToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokens = generateTokens(user);
    
    // Rotate refresh token
    user.refreshTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await user.save();

    return tokens;
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
};

export const logout = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  user.refreshTokenHash = null;
  await user.save();
};
