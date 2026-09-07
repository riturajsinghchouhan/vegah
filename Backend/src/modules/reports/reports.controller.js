import * as reportsService from './reports.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getReportsData = async (req, res, next) => {
  try {
    const data = await reportsService.getReportsData(req.query);
    sendSuccess(res, 200, 'Reports analytics data fetched successfully', data);
  } catch (error) {
    next(error);
  }
};
