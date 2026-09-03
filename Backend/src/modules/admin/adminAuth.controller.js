import * as adminAuthService from './adminAuth.service.js';
import { sendSuccess } from '../../utils/response.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await adminAuthService.login(email, password);
    
    const admin = result.admin.toObject();
    delete admin.passwordHash;
    delete admin.refreshTokenHash;

    sendSuccess(res, 200, 'Admin login successful', {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const result = await adminAuthService.register(req.body);
    
    const admin = result.admin.toObject();
    delete admin.passwordHash;
    delete admin.refreshTokenHash;

    sendSuccess(res, 201, 'Admin registered successfully', {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      admin,
    });
  } catch (error) {
    next(error);
  }
};
