import models from '../models/index.js';
const Op = models.Sequelize.Op;
import Accounts from './accounts.js';
import { numeric } from './parse_account_code.js';
import { balanceEngine } from './reporting/balance-engine.js';

/**
 * Fetch approved CrossSlipDetail rows for [startDate, endDate) for a tenant,
 * flattened with the parent slip's approvedAt so the engine can filter.
 */
const actualEntrySource = (tenantId, startDate, endDate) => ({
  name: 'actual',
  fetch: async () => {
    const rows = [];
    for (let mon = new Date(startDate); mon < new Date(endDate); ) {
      const slips = await models.CrossSlip.findAll({
        where: {
          [Op.and]: {
            tenantId,
            year: mon.getFullYear(),
            month: mon.getMonth() + 1,
          },
        },
        include: [{ model: models.CrossSlipDetail, as: 'lines' }],
      });
      for (const slip of slips) {
        for (const d of slip.lines || []) {
          rows.push({
            debitAccount: d.debitAccount,
            debitSubAccount: d.debitSubAccount,
            debitAmount: d.debitAmount,
            creditAccount: d.creditAccount,
            creditSubAccount: d.creditSubAccount,
            creditAmount: d.creditAmount,
            approvedAt: slip.approvedAt,
          });
        }
      }
      mon.setMonth(mon.getMonth() + 1);
    }
    return rows;
  },
});

/**
 * Trial balance for a tenant/term. Delegates calculation to the canonical
 * balanceEngine (libs/reporting/balance-engine.js) and shapes the result into
 * the legacy account-level line contract the /api/trial-balance route and the
 * trial-balance Svelte screen already consume:
 *   { major_name, middle_name, minor_name, *_nameVi, acl_code,
 *     name, nameVi, code, pickup, debit, credit, balance }
 *
 * pickup = opening balance, debit/credit = period movement, balance = ending.
 * Account-level rollup (subAccount:false) keeps one row per account, matching
 * the legacy screen which renders account rows with sub-accounts summed in.
 */
export default async (tenantId, term, endDate, options, languagePair) => {
  const fy = await models.FiscalYear.findOne({ where: { tenantId, term } });

  if (!endDate) {
    endDate = fy.endDate;
  }
  let startDate;
  if (options && options.monthly) {
    startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  } else {
    startDate = new Date(fy.startDate);
  }
  // endDate is an inclusive day boundary; advance one day so the month loop
  // and detail fetch include the final day.
  const fetchEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);

  const result = await balanceEngine(
    {
      tenantId,
      term,
      period: { from: startDate, to: endDate },
      entrySources: [actualEntrySource(tenantId, startDate, fetchEnd)],
      options: { subAccount: false },
    },
    models,
  );

  // Engine returns flat, name-less lines keyed by accountId. Join with
  // Accounts.all3 (the existing enriched-name + class-hierarchy source) so the
  // response keeps its bilingual names and major/middle/minor headers.
  const accounts = await Accounts.all3(tenantId, term, languagePair);
  const byCode = new Map();
  for (const line of result.lines) {
    byCode.set(line.code, line);
  }

  const lines = [];
  for (const acc of accounts) {
    if (!acc.code) {
      // account-class header row (no account); preserve for section rendering
      lines.push({
        major_name: acc.major_name,
        middle_name: acc.middle_name,
        minor_name: acc.minor_name,
        major_nameVi: acc.major_nameVi || '',
        middle_nameVi: acc.middle_nameVi || '',
        minor_nameVi: acc.minor_nameVi || '',
        acl_code: acc.acl_code,
      });
      continue;
    }
    const engineLine = byCode.get(acc.code);
    lines.push({
      major_name: acc.major_name,
      middle_name: acc.middle_name,
      minor_name: acc.minor_name,
      major_nameVi: acc.major_nameVi || '',
      middle_nameVi: acc.middle_nameVi || '',
      minor_nameVi: acc.minor_nameVi || '',
      acl_code: acc.acl_code,
      name: acc.name,
      nameVi: acc.nameVi || '',
      code: acc.code,
      pickup: engineLine ? numeric(engineLine.openingBalance) : 0,
      debit: engineLine ? numeric(engineLine.movementDebit) : 0,
      credit: engineLine ? numeric(engineLine.movementCredit) : 0,
      balance: engineLine ? numeric(engineLine.endingBalance) : 0,
    });
  }

  return { lines, accounts, warnings: result.warnings, meta: result.meta };
};
