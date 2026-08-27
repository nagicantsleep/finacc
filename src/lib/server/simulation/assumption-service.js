/**
 * SimulationAssumption CRUD + JSONB validation — Issue #263 (E3.2).
 *
 * Each assumption type has a parameter JSON schema. Validation uses Ajv.
 * CRUD is tenant-scoped — every call receives tenantId.
 */

import models from '../../models/index.js';
import Ajv from 'ajv';
import { getScenario } from './scenario-service.js';

// ---------------------------------------------------------------------------
// JSON schemas per type
// ---------------------------------------------------------------------------

const RECURRING_SCHEMA = {
  type: 'object',
  required: ['frequency', 'debitAccount', 'creditAccount', 'amount'],
  properties: {
    frequency:       { type: 'string', enum: ['monthly', 'quarterly', 'yearly'] },
    dayOfMonth:      { type: 'integer', minimum: 1, maximum: 31 },
    debitAccount:    { type: 'string', minLength: 1 },
    debitSubAccount: {},
    creditAccount:   { type: 'string', minLength: 1 },
    creditSubAccount: {},
    amount:          { type: 'number', exclusiveMinimum: 0 },
    taxRuleId:       {}, projectId: {}, labelId: {},
    memo:            { type: 'string' },
    increaseRule: {
      type: 'object',
      required: ['type', 'value'],
      properties: {
        type: { type: 'string', enum: ['percent', 'fixed'] },
        value: { type: 'number' },
      },
    },
  },
};

const REVENUE_GROWTH_SCHEMA = {
  type: 'object',
  required: ['revenueAccount', 'counterAccount', 'growthType', 'growthValue'],
  properties: {
    revenueAccount:  { type: 'string', minLength: 1 },
    counterAccount:  { type: 'string', minLength: 1 },
    growthType:      { type: 'string', enum: ['percent', 'fixed', 'manual', 'avg_last_3m', 'last_month'] },
    growthValue:     {},
    collectionTimingDays: { type: 'integer', enum: [0, 30, 60, 90] },
    taxRuleId:       {}, projectId: {},
  },
};

const EXPENSE_FIXED_SCHEMA = {
  type: 'object',
  required: ['expenseAccount', 'counterAccount', 'amountType'],
  properties: {
    expenseAccount:  { type: 'string', minLength: 1 },
    counterAccount:  { type: 'string', minLength: 1 },
    amountType:      { type: 'string', enum: ['fixed', 'percent_of_sales', 'headcount'] },
    amount:          { type: 'number' },
    percentOf:       { type: 'string', enum: ['sales', 'cogs'] },
    headcount: {
      type: 'object',
      required: ['count', 'salaryPerMonth', 'salaryAccount', 'insuranceAccount', 'insurancePct'],
      properties: {
        count:             { type: 'integer', minimum: 1 },
        salaryPerMonth:    { type: 'number', exclusiveMinimum: 0 },
        salaryAccount:     { type: 'string', minLength: 1 },
        insuranceAccount:  { type: 'string', minLength: 1 },
        insurancePct:      { type: 'number', minimum: 0 },
      },
    },
    paymentTimingDays: { type: 'integer', enum: [0, 30, 60] },
    taxRuleId:         {}, projectId: {},
  },
};

const SCHEMAS = {
  recurring:      RECURRING_SCHEMA,
  revenue_growth: REVENUE_GROWTH_SCHEMA,
  expense_fixed:  EXPENSE_FIXED_SCHEMA,
  expense_pct_of_sales: EXPENSE_FIXED_SCHEMA,
  expense_headcount:    EXPENSE_FIXED_SCHEMA,
};

const VALID_TYPES = Object.keys(SCHEMAS);

const ajv = new Ajv({ allErrors: true });
const VALIDATORS = {};
for (const [type, schema] of Object.entries(SCHEMAS)) {
  VALIDATORS[type] = ajv.compile(schema);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate parameters JSON against the assumption type schema.
 * Returns { valid, errors }.
 */
export function validateParameters(type, parameters) {
  if (!VALID_TYPES.includes(type)) {
    return { valid: false, errors: [`unknown type "${type}". allowed: ${VALID_TYPES.join(', ')}`] };
  }
  const validate = VALIDATORS[type];
  const ok = validate(parameters);
  if (!ok) {
    const msgs = (validate.errors || []).map(e => `${e.instancePath} ${e.message}`);
    return { valid: false, errors: msgs };
  }
  return { valid: true, errors: [] };
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------

async function _checkScenario(tenantId, scenarioId) {
  const scenario = await getScenario(tenantId, scenarioId);
  if (!scenario) {
    return { error: 'scenario not found', code: 404 };
  }
  if (scenario.status === 'locked') {
    return { error: 'scenario is locked', code: 409 };
  }
  return { scenario };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function listAssumptions(tenantId, scenarioId) {
  const chk = await _checkScenario(tenantId, scenarioId);
  if (chk.error) return chk;

  const rows = await models.SimulationAssumption.findAll({
    where: { tenantId, scenarioId },
    order: [['id', 'ASC']],
  });
  return { assumptions: rows };
}

export async function createAssumption(tenantId, scenarioId, data) {
  const chk = await _checkScenario(tenantId, scenarioId);
  if (chk.error) return chk;

  const { type, name, parameters, startMonth, endMonth, status } = data;

  if (!type || !name) {
    return { error: 'type and name are required', code: 400 };
  }
  if (!startMonth) {
    return { error: 'startMonth is required', code: 400 };
  }

  const v = validateParameters(type, parameters || {});
  if (!v.valid) return { error: `parameters: ${v.errors.join('; ')}`, code: 400 };

  const assumption = await models.SimulationAssumption.create({
    tenantId,
    scenarioId,
    type,
    name,
    parameters: parameters || {},
    startMonth,
    endMonth: endMonth || null,
    status: status || 'active',
  });
  return { assumption };
}

export async function getAssumption(tenantId, scenarioId, assumptionId) {
  const assumption = await models.SimulationAssumption.findOne({
    where: { id: assumptionId, tenantId, scenarioId },
  });
  if (!assumption) return { error: 'assumption not found', code: 404 };
  return { assumption };
}

export async function updateAssumption(tenantId, scenarioId, assumptionId, data) {
  const chk = await _checkScenario(tenantId, scenarioId);
  if (chk.error) return chk;

  const assumption = await models.SimulationAssumption.findOne({
    where: { id: assumptionId, tenantId, scenarioId },
  });
  if (!assumption) return { error: 'assumption not found', code: 404 };

  const updatable = ['name', 'parameters', 'startMonth', 'endMonth', 'status'];
  const patch = {};
  for (const k of updatable) {
    if (data[k] !== undefined) patch[k] = data[k];
  }

  if (patch.startMonth !== undefined && !patch.startMonth) {
    return { error: 'startMonth cannot be empty', code: 400 };
  }

  if (patch.parameters !== undefined) {
    const typeToCheck = data.type || assumption.type;
    const v = validateParameters(typeToCheck, patch.parameters);
    if (!v.valid) return { error: `parameters: ${v.errors.join('; ')}`, code: 400 };
  }

  await assumption.update(patch);
  return { assumption };
}

export async function deleteAssumption(tenantId, scenarioId, assumptionId) {
  const chk = await _checkScenario(tenantId, scenarioId);
  if (chk.error) return chk;

  const assumption = await models.SimulationAssumption.findOne({
    where: { id: assumptionId, tenantId, scenarioId },
  });
  if (!assumption) return { error: 'assumption not found', code: 404 };

  await assumption.destroy();
  return { ok: true };
}
