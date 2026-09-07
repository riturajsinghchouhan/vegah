import * as financeService from './finance.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getFinanceSummary = async (req, res, next) => {
  try {
    const data = await financeService.getFinanceSummary(req.query);
    sendSuccess(res, 200, 'Finance summary fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getSettlements = async (req, res, next) => {
  try {
    const data = await financeService.getSettlements(req.query);
    sendSuccess(res, 200, 'Settlements fetched successfully', data.settlements, data.meta);
  } catch (error) {
    next(error);
  }
};

export const getTaxBilling = async (req, res, next) => {
  try {
    const data = await financeService.getTaxBilling(req.query);
    sendSuccess(res, 200, 'Tax & Billing fetched successfully', data);
  } catch (error) {
    next(error);
  }
};
