/**
 * Virtual entry validator — Issue #231 (E2.3).
 *
 * 7 hard rules from `docs/stories/epics/E02-simulation/initiative.md`:
 *   1. debitAmount > 0  AND  creditAmount > 0
 *   2. debitAmount == creditAmount
 *   3. debitAccount != creditAccount
 *   4. date ∈ [scenario.simPeriodFrom, scenario.simPeriodTo]
 *   5. debitAccount, creditAccount belong to Account.accountCode of tenant
 *   6. debitSubAccount (if any) belongs to SubAccount of debitAccount
 *   7. creditSubAccount (if any) belongs to SubAccount of creditAccount
 *
 * Plus: scenario must be status='draft' for any write.
 */

import models from '../../models/index.js';

function toNumber(n) {
  if (n == null) return NaN;
  if (typeof n === 'string') return Number(n);
  return Number(n);
}

function isPositive(n) {
  return Number.isFinite(n) && n > 0;
}

function isDateOnly(s) {
  if (typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return s;
}

export async function validateEntry(scenario, input) {
  if (!scenario) return { error: 'scenario not found', code: 404 };
  if (scenario.status !== 'draft') {
    return { error: 'cannot edit entries on non-draft scenario', code: 409 };
  }

  const debit = toNumber(input.debitAmount);
  const credit = toNumber(input.creditAmount);
  if (!isPositive(debit) || !isPositive(credit)) {
    return { error: 'debitAmount and creditAmount must be > 0', code: 400, rule: 'AMOUNT_POSITIVE' };
  }
  if (debit !== credit) {
    return { error: 'debitAmount must equal creditAmount', code: 400, rule: 'BALANCED' };
  }

  if (!input.debitAccount || !input.creditAccount) {
    return { error: 'debitAccount and creditAccount are required', code: 400, rule: 'ACCOUNT_REQUIRED' };
  }
  if (input.debitAccount === input.creditAccount) {
    return { error: 'debitAccount and creditAccount must differ', code: 400, rule: 'UNEQUAL_ACCOUNTS' };
  }

  const date = isDateOnly(input.date);
  if (!date) {
    return { error: 'date must be YYYY-MM-DD', code: 400, rule: 'DATE_FORMAT' };
  }
  const from = scenario.simPeriodFrom instanceof Date
    ? scenario.simPeriodFrom.toISOString().slice(0, 10)
    : String(scenario.simPeriodFrom).slice(0, 10);
  const to = scenario.simPeriodTo instanceof Date
    ? scenario.simPeriodTo.toISOString().slice(0, 10)
    : String(scenario.simPeriodTo).slice(0, 10);
  if (date < from || date > to) {
    return {
      error: `date must be in [${from}, ${to}]`,
      code: 400,
      rule: 'DATE_IN_PERIOD',
    };
  }

  const accounts = await models.Account.findAll({
    where: {
      tenantId: scenario.tenantId,
      accountCode: { [models.Sequelize.Op.in]: [input.debitAccount, input.creditAccount] },
    },
    include: [{ model: models.SubAccount, as: 'subAccounts' }],
  });
  if (accounts.length < 2) {
    return { error: 'account code(s) not found for tenant', code: 400, rule: 'ACCOUNT_NOT_FOUND' };
  }
  const debitAcc = accounts.find((a) => a.accountCode === input.debitAccount);
  const creditAcc = accounts.find((a) => a.accountCode === input.creditAccount);
  if (!debitAcc || !creditAcc) {
    return { error: 'account code(s) not found for tenant', code: 400, rule: 'ACCOUNT_NOT_FOUND' };
  }

  if (input.debitSubAccount != null) {
    const found = (debitAcc.subAccounts || []).find((s) => s.id === input.debitSubAccount);
    if (!found) {
      return { error: 'debitSubAccount not under debitAccount', code: 400, rule: 'DEBIT_SUB_ACCOUNT' };
    }
  }
  if (input.creditSubAccount != null) {
    const found = (creditAcc.subAccounts || []).find((s) => s.id === input.creditSubAccount);
    if (!found) {
      return { error: 'creditSubAccount not under creditAccount', code: 400, rule: 'CREDIT_SUB_ACCOUNT' };
    }
  }

  return { ok: true };
}

export async function listEntries(tenantId, scenarioId) {
  return models.SimulationEntry.findAll({
    where: { tenantId, scenarioId },
    order: [['date', 'ASC'], ['id', 'ASC']],
  });
}

export async function createEntry(tenantId, scenarioId, input) {
  const scenario = await models.SimulationScenario.findOne({ where: { id: scenarioId, tenantId } });
  const v = await validateEntry(scenario, input);
  if (v.error) return v;
  return models.SimulationEntry.create({
    tenantId,
    scenarioId,
    date: input.date,
    debitAccount: input.debitAccount,
    debitSubAccount: input.debitSubAccount || null,
    debitAmount: input.debitAmount,
    creditAccount: input.creditAccount,
    creditSubAccount: input.creditSubAccount || null,
    creditAmount: input.creditAmount,
    taxRuleId: input.taxRuleId || null,
    projectId: input.projectId || null,
    labelId: input.labelId || null,
    memo: input.memo || null,
    sourceType: 'manual',
  });
}

export async function updateEntry(tenantId, scenarioId, entryId, input) {
  const existing = await models.SimulationEntry.findOne({ where: { id: entryId, tenantId, scenarioId } });
  if (!existing) return { error: 'entry not found', code: 404 };
  const scenario = await models.SimulationScenario.findOne({ where: { id: scenarioId, tenantId } });
  const merged = { ...existing.toJSON(), ...input };
  const v = await validateEntry(scenario, merged);
  if (v.error) return v;
  await existing.update(input);
  return { entry: existing };
}

export async function deleteEntry(tenantId, scenarioId, entryId) {
  const existing = await models.SimulationEntry.findOne({ where: { id: entryId, tenantId, scenarioId } });
  if (!existing) return { error: 'entry not found', code: 404 };
  const scenario = await models.SimulationScenario.findOne({ where: { id: scenarioId, tenantId } });
  if (!scenario) return { error: 'scenario not found', code: 404 };
  if (scenario.status !== 'draft') {
    return { error: 'cannot delete entries on non-draft scenario', code: 409 };
  }
  await existing.destroy();
  return { ok: true };
}
