import * as client from './zoho.client.js';

/**
 * Reads the ids an admin has to map, straight out of the connected Zoho
 * organisation, so the mapping screen offers a dropdown instead of asking
 * someone to copy 16-digit ids out of Zoho's URL bar.
 */

/** Bank and cash accounts -- the only ones a payment can be deposited into. */
export const listDepositAccounts = async () => {
  const data = await client.get('/chartofaccounts', { filter_by: 'AccountType.Active' });
  return (data.chartofaccounts || [])
    .filter((account) => ['cash', 'bank'].includes(account.account_type))
    .map((account) => ({
      id: account.account_id,
      name: account.account_name,
      type: account.account_type,
    }));
};

/** Expense accounts, for mapping each expense category in module 4. */
export const listExpenseAccounts = async () => {
  const data = await client.get('/chartofaccounts', { filter_by: 'AccountType.Active' });
  return (data.chartofaccounts || [])
    .filter((account) => ['expense', 'cost_of_goods_sold', 'other_expense'].includes(account.account_type))
    .map((account) => ({
      id: account.account_id,
      name: account.account_name,
      type: account.account_type,
    }));
};

/**
 * GST taxes and tax groups. A group matters for intra-state supply, where Zoho
 * models CGST+SGST as one group rather than two separate taxes.
 */
/**
 * Every tax the org can apply, each tagged with the direction it is for.
 *
 * An India organisation returns both kinds from this one endpoint: a CGST+SGST
 * group marked `intra` and a single IGST tax marked `inter`, at the same rate.
 * `direction` is what keeps those apart, and mapping the wrong one files the
 * invoice under the wrong head.
 *
 * `/settings/taxgroups` is deliberately not called: Zoho answers it with
 * "HTTP method GET is not allowed" (error 37), and the groups are already in
 * this response. It used to be called behind a catch that hid the failure.
 */
export const listTaxes = async () => {
  const data = await client.get('/settings/taxes');

  return (data.taxes || []).map((tax) => ({
    id: tax.tax_id,
    name: tax.tax_name,
    percentage: tax.tax_percentage,
    // Absent outside India editions, where the intra/inter split does not apply.
    direction: tax.tax_specification || null,
    isGroup: tax.tax_type === 'tax_group',
  }));
};

export const listAll = async () => {
  const [depositAccounts, expenseAccounts, taxes] = await Promise.all([
    listDepositAccounts(),
    listExpenseAccounts(),
    listTaxes(),
  ]);
  return { depositAccounts, expenseAccounts, taxes };
};
