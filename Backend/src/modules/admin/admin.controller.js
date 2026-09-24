import * as adminService from './admin.service.js';
import * as reportsService from './reports.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getReportsAnalytics = async (req, res, next) => {
  try {
    const data = await reportsService.getReportsData(req.query);
    sendSuccess(res, 200, 'Reports data fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getFleetTimeline = async (req, res, next) => {
  try {
    const data = await adminService.getFleetTimeline(req.query);
    sendSuccess(res, 200, 'Fleet timeline fetched successfully', data);
  } catch (error) {
    next(error);
  }
};
