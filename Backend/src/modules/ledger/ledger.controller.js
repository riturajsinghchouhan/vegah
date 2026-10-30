import * as reports from './reports.service.js';
import * as ledger from './ledger.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getBalanceSheet = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Balance sheet fetched successfully', await reports.getBalanceSheet(req.query));
  } catch (error) { next(error); }
};

export const getProfitAndLoss = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Profit & loss fetched successfully', await reports.getProfitAndLoss(req.query));
  } catch (error) { next(error); }
};

export const getReceiptsAndPayments = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Receipts & payments fetched successfully', await reports.getReceiptsAndPayments(req.query));
  } catch (error) { next(error); }
};

export const getTrialBalance = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Trial balance fetched successfully', await ledger.getTrialBalance(req.query));
  } catch (error) { next(error); }
};

export const getDailyCheck = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Daily check completed', await reports.getDailyCheck(req.query));
  } catch (error) { next(error); }
};

export const listJournalEntries = async (req, res, next) => {
  try {
    const data = await reports.listJournalEntries(req.query);
    sendSuccess(res, 200, 'Journal entries fetched successfully', data.entries, data.meta);
  } catch (error) { next(error); }
};

export const listAccounts = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Chart of accounts fetched successfully', await reports.listAccounts());
  } catch (error) { next(error); }
};

/** CSV so the CA can work in Excel without any other tool. */
export const exportCsv = async (req, res, next) => {
  try {
    const { filename, csv } = await reports.buildCsv(req.params.report, req.query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) { next(error); }
};

export const listPeriods = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Accounting periods fetched successfully', await ledger.listPeriods());
  } catch (error) { next(error); }
};

export const closePeriod = async (req, res, next) => {
  try {
    const period = await ledger.closePeriod(req.body.periodKey, req.user?._id);
    sendSuccess(res, 200, `Period ${period.periodKey} closed`, period);
  } catch (error) { next(error); }
};

export const reopenPeriod = async (req, res, next) => {
  try {
    const period = await ledger.reopenPeriod(req.body.periodKey, req.user?._id, req.body.reason);
    sendSuccess(res, 200, `Period ${period.periodKey} reopened`, period);
  } catch (error) { next(error); }
};

export const postVoucher = async (req, res, next) => {
  try {
    const entry = await ledger.postManualVoucher({
      date: req.body.date,
      narration: req.body.narration,
      lines: req.body.lines,
      adminId: req.user?._id,
    });
    sendSuccess(res, 201, `Voucher ${entry.entryNo} posted`, entry);
  } catch (error) { next(error); }
};

export const reverseEntry = async (req, res, next) => {
  try {
    const entry = await ledger.reverseEntry({
      entryId: req.params.id,
      reason: req.body.reason,
      postedBy: req.user?._id,
      postedByType: 'ADMIN',
    });
    sendSuccess(res, 201, `Reversal ${entry.entryNo} posted`, entry);
  } catch (error) { next(error); }
};

export const recordCashHandover = async (req, res, next) => {
  try {
    const entry = await ledger.recordCashHandover({
      amount: req.body.amount,
      date: req.body.date,
      reference: req.body.reference,
      adminId: req.user?._id,
    });
    sendSuccess(res, 201, `Cash handover ${entry.entryNo} recorded`, entry);
  } catch (error) { next(error); }
};

export const recordGatewaySettlement = async (req, res, next) => {
  try {
    const entry = await ledger.recordGatewaySettlement({
      grossSettled: req.body.grossSettled,
      gatewayFee: req.body.gatewayFee,
      gstOnFee: req.body.gstOnFee,
      date: req.body.date,
      reference: req.body.reference,
      adminId: req.user?._id,
    });
    sendSuccess(res, 201, `Settlement ${entry.entryNo} recorded`, entry);
  } catch (error) { next(error); }
};

export const getPendingMoney = async (req, res, next) => {
  try {
    const [cashInHand, awaitingSettlement] = await Promise.all([
      ledger.getAccountBalance('CASH_IN_HAND'),
      ledger.getAccountBalance('GATEWAY_RECEIVABLE'),
    ]);
    sendSuccess(res, 200, 'Pending money fetched successfully', {
      cashInHand: cashInHand / 100,
      awaitingSettlement: awaitingSettlement / 100,
    });
  } catch (error) { next(error); }
};

export const installChart = async (req, res, next) => {
  try {
    const result = await ledger.installChartOfAccounts();
    sendSuccess(res, 200, 'Chart of accounts installed', result);
  } catch (error) { next(error); }
};
