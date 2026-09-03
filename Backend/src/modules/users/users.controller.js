import * as usersService from './users.service.js';
import { sendSuccess } from '../../utils/response.js';

export const listUsers = async (req, res, next) => {
  try {
    const result = await usersService.listUsers(req.query);
    sendSuccess(res, 200, 'Users fetched successfully', result.users, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    // If it's a regular user, they can only get their own profile
    let userId = req.params.id;
    if (req.user.role === 'USER' && userId !== req.user.id) {
      // Return their own profile anyway or throw error. Let's return their own if 'me' is used
      userId = req.user.id;
    }
    
    if (req.params.id === 'me') {
      userId = req.user.id;
    }

    const user = await usersService.getUserById(userId);
    sendSuccess(res, 200, 'User fetched successfully', user);
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const user = await usersService.blockUser(req.params.id);
    sendSuccess(res, 200, 'User blocked successfully', user);
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const user = await usersService.unblockUser(req.params.id);
    sendSuccess(res, 200, 'User unblocked successfully', user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await usersService.updateProfile(userId, req.body);
    sendSuccess(res, 200, 'Profile updated successfully', user);
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (req, res, next) => {
  try {
    const document = await usersService.uploadDocument(req.user.id, req.body, req.file);
    sendSuccess(res, 201, 'Document uploaded successfully', document);
  } catch (error) {
    next(error);
  }
};

export const getUserDocuments = async (req, res, next) => {
  try {
    const documents = await usersService.getUserDocuments(req.user.id);
    sendSuccess(res, 200, 'Documents fetched successfully', documents);
  } catch (error) {
    next(error);
  }
};
