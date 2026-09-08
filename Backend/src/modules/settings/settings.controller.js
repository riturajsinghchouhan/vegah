import * as settingsService from './settings.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings(req.query.category);
    sendSuccess(res, 200, 'Settings fetched successfully', settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const category = req.query.category;
    const updated = await settingsService.updateSettings(req.body, req.user?._id, category);
    sendSuccess(res, 200, 'Settings updated successfully', updated);
  } catch (error) {
    next(error);
  }
};
