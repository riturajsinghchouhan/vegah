import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Admin from '../../models/Admin.js';
import env from '../../config/env.js';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

const generateTokens = (admin) => {
  const payload = {
    id: admin._id,
    role: admin.role,
    email: admin.email,
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });
  
  return { accessToken, refreshToken };
};

export const login = async (email, password) => {
  const admin = await Admin.findOne({ email }).select('+passwordHash +refreshTokenHash');

  if (!admin) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (!admin.isActive) {
    throw new ForbiddenError('Your account has been deactivated');
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    throw new ForbiddenError(`Account locked. Try again after ${admin.lockedUntil.toISOString()}`);
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);

  if (!isMatch) {
    admin.failedLoginAttempts += 1;
    if (admin.failedLoginAttempts >= env.PASSWORD_RESET_MAX_ATTEMPTS) {
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 30);
      admin.lockedUntil = lockTime;
      logger.warn(`Admin account ${email} locked due to multiple failed login attempts`);
    }
    await admin.save();
    throw new UnauthorizedError('Invalid credentials');
  }

  // Success login
  admin.failedLoginAttempts = 0;
  admin.lockedUntil = null;
  admin.lastLoginAt = new Date();

  const { accessToken, refreshToken } = generateTokens(admin);

  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  admin.refreshTokenHash = refreshTokenHash;
  await admin.save();

  return { accessToken, refreshToken, admin };
};

export const register = async (data) => {
  const { fullName, email, password, registrationCode } = data;

  if (registrationCode !== env.ADMIN_REGISTRATION_CODE) {
    throw new ForbiddenError('Invalid registration code');
  }

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new BadRequestError('Admin with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await Admin.create({
    fullName,
    email,
    passwordHash,
    role: 'ADMIN', // Default to normal admin, SUPER_ADMIN must be seeded or assigned
  });

  const { accessToken, refreshToken } = generateTokens(admin);

  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  admin.refreshTokenHash = refreshTokenHash;
  await admin.save();

  return { accessToken, refreshToken, admin };
};
