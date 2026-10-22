import * as financeService from './finance.service.js';
import * as accountingService from './accounting.service.js';
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

export const createInvoice = async (req, res, next) => {
  try {
    const data = await financeService.createInvoice(req.body, req.user?._id);
    sendSuccess(res, 201, 'Invoice created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const data = await financeService.deleteInvoice(req.params.id, req.user?._id);
    sendSuccess(res, 200, 'Invoice moved to bin', data);
  } catch (error) {
    next(error);
  }
};

export const listDeletedInvoices = async (req, res, next) => {
  try {
    const data = await financeService.listDeletedInvoices();
    sendSuccess(res, 200, 'Deleted invoices fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const restoreInvoice = async (req, res, next) => {
  try {
    const data = await financeService.restoreInvoice(req.params.id);
    sendSuccess(res, 200, 'Invoice restored', data);
  } catch (error) {
    next(error);
  }
};

export const purgeInvoice = async (req, res, next) => {
  try {
    const data = await financeService.purgeInvoice(req.params.id);
    sendSuccess(res, 200, 'Invoice permanently deleted', data);
  } catch (error) {
    next(error);
  }
};

export const getAccountingSummary = async (req, res, next) => {
  try {
    const data = await accountingService.getAccountingSummary(req.query);
    sendSuccess(res, 200, 'Accounting summary fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getExpenseMeta = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Expense options fetched successfully', accountingService.getExpenseMeta());
  } catch (error) {
    next(error);
  }
};

export const listExpenses = async (req, res, next) => {
  try {
    const data = await accountingService.listExpenses(req.query);
    sendSuccess(res, 200, 'Expenses fetched successfully', data.expenses, data.meta);
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const data = await accountingService.createExpense(req.body, req.user?._id);
    sendSuccess(res, 201, 'Expense added successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const data = await accountingService.updateExpense(req.params.id, req.body, req.user?._id);
    sendSuccess(res, 200, 'Expense updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    await accountingService.deleteExpense(req.params.id);
    sendSuccess(res, 200, 'Expense deleted successfully');
  } catch (error) {
    next(error);
  }
};
