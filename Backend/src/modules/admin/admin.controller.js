import * as adminService from './admin.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getFleetTimeline = async (req, res, next) => {
  try {
    const data = await adminService.getFleetTimeline(req.query);
    sendSuccess(res, 200, 'Fleet timeline fetched successfully', data);
  } catch (error) {
    next(error);
  }
};
