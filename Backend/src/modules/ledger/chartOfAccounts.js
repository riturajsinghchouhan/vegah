// The chart of accounts as plain data, pending CA sign-off (draft 1).
//
// Posting rules address accounts by `key`, never by `code`, so the accountant
// can renumber the chart without touching a line of posting logic.
//
// `isCash` marks the accounts whose movements make up the receipts and payments
// statement. `subLedger` marks a control account whose balance must equal the
// total of its sub-ledger, checked daily.

export const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
export const SUB_LEDGERS = ['RIDER', 'VEHICLE', 'BATTERY', 'STATION', 'VENDOR'];

export const CHART_OF_ACCOUNTS = [
  // --- Assets ---
  { key: 'CASH_IN_HAND', code: '1010', name: 'Cash in Hand — Hub', type: 'ASSET', isCash: true },
  { key: 'BANK_CURRENT', code: '1020', name: 'Bank — Current Account', type: 'ASSET', isCash: true },
  { key: 'GATEWAY_RECEIVABLE', code: '1030', name: 'Payment Gateway Receivable', type: 'ASSET' },
  { key: 'SUSPENSE', code: '1040', name: 'Suspense — Unmatched Receipts', type: 'ASSET' },
  { key: 'TRADE_RECEIVABLE_RIDERS', code: '1100', name: 'Trade Receivables — Riders', type: 'ASSET', subLedger: 'RIDER' },
  { key: 'CHALLAN_RECOVERABLE', code: '1110', name: 'Challans Recoverable from Riders', type: 'ASSET', subLedger: 'RIDER' },
  { key: 'INSURANCE_CLAIMS_RECEIVABLE', code: '1120', name: 'Insurance Claims Receivable', type: 'ASSET' },
  { key: 'VEHICLES_COST', code: '1200', name: 'Vehicles — at Cost', type: 'ASSET', subLedger: 'VEHICLE' },
  { key: 'BATTERY_PACKS_COST', code: '1210', name: 'Battery Packs — at Cost', type: 'ASSET', subLedger: 'BATTERY' },
  { key: 'STATION_EQUIPMENT_COST', code: '1220', name: 'Swap Station Equipment & Chargers — at Cost', type: 'ASSET', subLedger: 'STATION' },
  { key: 'OFFICE_IT_COST', code: '1230', name: 'Office & IT Equipment — at Cost', type: 'ASSET' },
  { key: 'ACCUM_DEP_VEHICLES', code: '1290', name: 'Accumulated Depreciation — Vehicles', type: 'ASSET', isContra: true, subLedger: 'VEHICLE' },
  { key: 'ACCUM_DEP_BATTERIES', code: '1291', name: 'Accumulated Depreciation — Battery Packs', type: 'ASSET', isContra: true, subLedger: 'BATTERY' },
  { key: 'ACCUM_DEP_STATION', code: '1292', name: 'Accumulated Depreciation — Station Equipment', type: 'ASSET', isContra: true, subLedger: 'STATION' },
  { key: 'ACCUM_DEP_OFFICE_IT', code: '1293', name: 'Accumulated Depreciation — Office & IT', type: 'ASSET', isContra: true },
  { key: 'GST_INPUT_CREDIT', code: '1300', name: 'GST Input Tax Credit', type: 'ASSET' },
  { key: 'PREPAID_EXPENSES', code: '1400', name: 'Prepaid Expenses', type: 'ASSET' },
  { key: 'DEPOSITS_PAID_LANDLORDS', code: '1410', name: 'Security Deposits Paid — Landlords', type: 'ASSET' },

  // --- Liabilities ---
  { key: 'RIDER_DEPOSITS', code: '2010', name: 'Security Deposits from Riders', type: 'LIABILITY', subLedger: 'RIDER' },
  { key: 'RIDER_WALLET', code: '2020', name: 'Rider Wallet Balances', type: 'LIABILITY', subLedger: 'RIDER' },
  { key: 'RIDER_ADVANCES', code: '2030', name: 'Rider Advances / Unapplied Receipts', type: 'LIABILITY', subLedger: 'RIDER' },
  { key: 'DEFERRED_REVENUE_RENTAL', code: '2100', name: 'Deferred Revenue — Rental Plans', type: 'LIABILITY' },
  { key: 'DEFERRED_REVENUE_SWAP', code: '2110', name: 'Deferred Revenue — Unlimited Swap Plans', type: 'LIABILITY' },
  { key: 'GST_OUTPUT_PAYABLE', code: '2200', name: 'GST Output Payable', type: 'LIABILITY' },
  { key: 'TDS_PAYABLE', code: '2210', name: 'TDS Payable', type: 'LIABILITY' },
  { key: 'TRADE_PAYABLES', code: '2300', name: 'Trade Payables — Vendors', type: 'LIABILITY', subLedger: 'VENDOR' },
  { key: 'REFUNDS_PAYABLE', code: '2310', name: 'Refunds Payable to Riders', type: 'LIABILITY', subLedger: 'RIDER' },
  { key: 'VEHICLE_LOANS', code: '2400', name: 'Vehicle Loans / Hire Purchase', type: 'LIABILITY' },
  { key: 'INTEREST_ACCRUED', code: '2410', name: 'Interest Accrued but Not Due', type: 'LIABILITY' },

  // --- Equity ---
  { key: 'OWNERS_CAPITAL', code: '3010', name: "Owner's Capital", type: 'EQUITY' },
  { key: 'RETAINED_EARNINGS', code: '3020', name: 'Retained Earnings', type: 'EQUITY' },
  // Holds the other side of balances carried in at cut-over whose origin the
  // app has no record of, such as rider wallet credit with no transaction
  // history. The accountant reclassifies it once the opening trial balance is
  // agreed; until then it should not be treated as real equity.
  { key: 'OPENING_BALANCE_EQUITY', code: '3040', name: 'Opening Balance Equity (to be reclassified)', type: 'EQUITY' },

  // --- Income ---
  { key: 'RENTAL_INCOME', code: '4010', name: 'Rental Income — Vehicles', type: 'INCOME' },
  { key: 'SWAP_INCOME', code: '4020', name: 'Battery Swap Income', type: 'INCOME' },
  { key: 'SERVICE_FEE_INCOME', code: '4030', name: 'Service Fee Income', type: 'INCOME' },
  { key: 'PLATFORM_FEE_INCOME', code: '4040', name: 'Platform Fee Income', type: 'INCOME' },
  { key: 'LATE_FEE_INCOME', code: '4050', name: 'Late Fee & Overdue Income', type: 'INCOME' },
  { key: 'DAMAGE_RECOVERY_INCOME', code: '4060', name: 'Damage Recovery Income', type: 'INCOME' },
  { key: 'CHALLAN_ADMIN_FEE', code: '4070', name: 'Challan Recovery — Administration Fee', type: 'INCOME' },
  { key: 'CANCELLATION_FEE_INCOME', code: '4080', name: 'Cancellation Fee Income', type: 'INCOME' },
  { key: 'DISCOUNTS_ALLOWED', code: '4090', name: 'Discounts & Coupons Allowed', type: 'INCOME', isContra: true },

  // --- Direct costs ---
  { key: 'ELECTRICITY_CHARGING', code: '5010', name: 'Electricity & Charging', type: 'EXPENSE' },
  { key: 'SWAP_STATION_CHARGES', code: '5020', name: 'Swap Station Charges — Partner Network', type: 'EXPENSE', subLedger: 'STATION' },
  { key: 'MAINTENANCE_REPAIRS', code: '5030', name: 'Vehicle Maintenance & Repairs', type: 'EXPENSE', subLedger: 'VEHICLE' },
  { key: 'TYRES_CONSUMABLES', code: '5040', name: 'Tyres & Consumables', type: 'EXPENSE', subLedger: 'VEHICLE' },
  { key: 'INSURANCE_FLEET', code: '5050', name: 'Insurance — Fleet', type: 'EXPENSE' },

  // --- Operating expenses ---
  { key: 'SALARIES', code: '6010', name: 'Salaries & Wages', type: 'EXPENSE' },
  { key: 'RENT', code: '6020', name: 'Hub & Station Rent', type: 'EXPENSE' },
  { key: 'GATEWAY_CHARGES', code: '6030', name: 'Payment Gateway Charges', type: 'EXPENSE' },
  { key: 'MARKETING', code: '6040', name: 'Marketing & Promotion', type: 'EXPENSE' },
  { key: 'TRANSPORT_LOGISTICS', code: '6050', name: 'Transport & Logistics', type: 'EXPENSE' },
  { key: 'OFFICE_ADMIN', code: '6060', name: 'Office & Administration', type: 'EXPENSE' },
  { key: 'PROFESSIONAL_FEES', code: '6070', name: 'Professional & Legal Fees', type: 'EXPENSE' },
  { key: 'DEP_VEHICLES', code: '6080', name: 'Depreciation — Vehicles', type: 'EXPENSE', subLedger: 'VEHICLE' },
  { key: 'DEP_BATTERIES', code: '6081', name: 'Depreciation — Battery Packs', type: 'EXPENSE', subLedger: 'BATTERY' },
  { key: 'DEP_STATION', code: '6082', name: 'Depreciation — Station Equipment', type: 'EXPENSE', subLedger: 'STATION' },
  { key: 'DEP_OFFICE_IT', code: '6083', name: 'Depreciation — Office & IT', type: 'EXPENSE' },
  { key: 'BAD_DEBTS', code: '6090', name: 'Bad Debts Written Off', type: 'EXPENSE' },
  { key: 'LOSS_ON_WRITE_OFF', code: '6100', name: 'Loss on Asset Write-off, Theft or Sale', type: 'EXPENSE' },
  { key: 'INTEREST_ON_LOANS', code: '6110', name: 'Interest on Vehicle Loans', type: 'EXPENSE' },
  { key: 'BANK_CHARGES', code: '6120', name: 'Bank Charges', type: 'EXPENSE' },
];

const DEBIT_TYPES = ['ASSET', 'EXPENSE'];

export const normalSideOf = ({ type, isContra = false }) => {
  const natural = DEBIT_TYPES.includes(type) ? 'DEBIT' : 'CREDIT';
  if (!isContra) return natural;
  return natural === 'DEBIT' ? 'CREDIT' : 'DEBIT';
};

export const statementOf = ({ type }) => (
  ['INCOME', 'EXPENSE'].includes(type) ? 'PROFIT_LOSS' : 'BALANCE_SHEET'
);

export const ACCOUNT_KEYS = CHART_OF_ACCOUNTS.map((account) => account.key);

export const findAccountDefinition = (key) => CHART_OF_ACCOUNTS.find((account) => account.key === key) || null;
