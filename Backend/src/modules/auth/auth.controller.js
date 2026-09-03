import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';

export const requestOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const result = await authService.requestOtp(phone);
    sendSuccess(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const result = await authService.verifyOtp(phone, otp);
    
    // Remove sensitive fields before sending user data
    const user = result.user.toObject();
    delete user.refreshTokenHash;

    sendSuccess(res, 200, 'Login successful', {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user,
      isNewUser: result.isNewUser,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const result = await authService.refreshToken(token);
    
    sendSuccess(res, 200, 'Token refreshed successfully', {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};
