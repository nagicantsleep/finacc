/**
 * Assumption generator — Issue #264 (E3.3), #265 (E3.4), #266 (E3.5).
 *
 * Generates SimulationEntry[] from assumptions — never writes to DB.
 * Preview + Regenerate call these pure generator functions.
 */

/**
 * Yield the actual day of month to use, clamping to the last calendar day.
 * e.g. dayOfMonth=31, month=2 → clamp to 28 or 29 (leap year aware).
 */
function effectiveDay(year, month, dayOfMonth) {
  const last = new Date(year, month, 0).getDate(); // month is 1-based here, so day 0 = last day of prev month
  return Math.min(dayOfMonth, last);
}

function toDateStr(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function maxDate(a, b) {
  // a and b are 'YYYY-MM-DD'
  return a > b ? a : b;
}

function minDate(a, b) {
  return a < b ? a : b;
}

/**
 * Generate simulation entries from a recurring assumption.
 *
 * @param {object} assumption — row from SimulationAssumption (with .parameters)
 * @param {object} scenario   — SimulationScenario row (gives simPeriodFrom, simPeriodTo)
 * @returns {object[]} Array of plain entry objects (not persisted)
 */
export function generateRecurringEntries(assumption, scenario) {
  const p = assumption.parameters;
  const frequency = p.frequency; // 'monthly' | 'quarterly' | 'yearly'
  const dayOfMonth = p.dayOfMonth || 1;

  // Date range: start = max(assumption.startMonth, scenario.simPeriodFrom)
  //             end   = min(assumption.endMonth or scenario.simPeriodTo, scenario.simPeriodTo)
  const startDate = maxDate(assumption.startMonth, scenario.simPeriodFrom);
  const endDate = minDate(assumption.endMonth || scenario.simPeriodTo, scenario.simPeriodTo);

  const entries = [];

  let baseAmount = p.amount;
  if (!baseAmount || baseAmount <= 0) return entries;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1; // 1-based

  const months = [];
  let y = startYear;
  let m = startMonth;

  if (frequency === 'monthly') {
    const totalMonths = (end.getFullYear() - startYear) * 12 + (end.getMonth() + 1) - startMonth + 1;
    for (let i = 0; i < totalMonths; i++) {
      months.push({ year: y, month: m });
      m++;
      if (m > 12) { m = 1; y++; }
    }
  } else if (frequency === 'quarterly') {
    // Anchor to start month; then step by 3
    while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth() + 1)) {
      months.push({ year: y, month: m });
      m += 3;
      if (m > 12) { m -= 12; y++; }
    }
  } else if (frequency === 'yearly') {
    months.push({ year: startYear, month: startMonth });
    // If the end year is later, add subsequent years (same month)
    for (let cy = startYear + 1; cy <= end.getFullYear(); cy++) {
      if (cy === end.getFullYear() && startMonth > end.getMonth() + 1) break;
      months.push({ year: cy, month: startMonth });
    }
  }

  const increaseRule = p.increaseRule; // { type: 'percent'|'fixed', value }

  for (let i = 0; i < months.length; i++) {
    const { year, month } = months[i];
    const day = effectiveDay(year, month, dayOfMonth);
    const dateStr = toDateStr(year, month, day);

    // Must be within [startDate, endDate]
    if (dateStr < startDate || dateStr > endDate) continue;

    // Compute amount with increase rule (applied after first entry)
    let amount = baseAmount;
    if (i > 0 && increaseRule) {
      if (increaseRule.type === 'percent') {
        amount = baseAmount * Math.pow(1 + increaseRule.value / 100, i);
      } else if (increaseRule.type === 'fixed') {
        amount = baseAmount + increaseRule.value * i;
      }
    }
    // Round to integer yen (PostgreSQL DECIMAL(12) has scale 0)
    amount = Math.round(amount);

    entries.push({
      date: dateStr,
      debitAccount: p.debitAccount,
      debitSubAccount: p.debitSubAccount || null,
      debitAmount: amount,
      creditAccount: p.creditAccount,
      creditSubAccount: p.creditSubAccount || null,
      creditAmount: amount,
      taxRuleId: p.taxRuleId || null,
      projectId: p.projectId || null,
      labelId: p.labelId || null,
      memo: p.memo || `${assumption.name} (${dateStr})`,
      sourceType: 'recurring',
    });
  }

  return entries;
}

/**
 * Generate simulation entries from a revenue_growth assumption.
 *
 * growthValue semantics by growthType:
 *   percent  — base amount (month 1), compounded by .growthRate % each month
 *   fixed    — base amount (month 1), + .increment each subsequent month
 *   manual   — array of amounts per month
 *   avg_last_3m — uses average of last 3 priorRevenues (growthValue ignored)
 *   last_month  — uses last priorRevenue (growthValue ignored)
 *
 * @param {object}  assumption
 * @param {object}  scenario
 * @param {number[]} priorRevenues — previous months' revenue (needed for avg/prev based growth)
 * @returns {object[]} entries
 */
export function generateRevenueGrowthEntries(assumption, scenario, priorRevenues = []) {
  const p = assumption.parameters;
  const { growthType, growthValue, revenueAccount, counterAccount } = p;
  const timingDays = p.collectionTimingDays || 0;

  const startDate = maxDate(assumption.startMonth, scenario.simPeriodFrom);
  const endDate = minDate(assumption.endMonth || scenario.simPeriodTo, scenario.simPeriodTo);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const baseY = start.getFullYear();
  const baseM = start.getMonth() + 1;

  let totalMonths =
    (end.getFullYear() - baseY) * 12 + (end.getMonth() + 1) - baseM + 1;
  if (totalMonths < 0) return [];

  const entries = [];

  for (let i = 0; i < totalMonths; i++) {
    let y = baseY, m = baseM + i;
    while (m > 12) { m -= 12; y++; }
    const dateStr = toDateStr(y, m, 1);
    if (dateStr < startDate || dateStr > endDate) continue;

    let amount;
    switch (growthType) {
      case 'percent':
        // growthValue = base; .growthRate = percentage per month
        amount = growthValue * Math.pow(1 + (p.growthRate || 0) / 100, i);
        amount = Math.round(amount);
        break;
      case 'fixed':
        // growthValue = base; .increment = addition per month
        amount = (growthValue || 0) + (p.increment || 0) * i;
        break;
      case 'manual':
        amount = Array.isArray(growthValue) ? (growthValue[i] || 0) : 0;
        break;
      case 'avg_last_3m': {
        const slice = priorRevenues.slice(-3);
        amount = slice.length > 0
          ? Math.round(slice.reduce((s, v) => s + v, 0) / slice.length)
          : 0;
        break;
      }
      case 'last_month':
        amount = priorRevenues.length > 0 ? priorRevenues[priorRevenues.length - 1] : 0;
        break;
      default:
        amount = growthValue || 0;
    }

    if (!amount || amount <= 0) continue;

    // Accrual entry — revenue recognition on the month
    entries.push({
      date: dateStr,
      debitAccount: counterAccount,
      debitSubAccount: null,
      debitAmount: amount,
      creditAccount: revenueAccount,
      creditSubAccount: null,
      creditAmount: amount,
      taxRuleId: p.taxRuleId || null,
      projectId: p.projectId || null,
      labelId: null,
      memo: `${assumption.name} (revenue ${dateStr})`,
      sourceType: 'formula',
    });

    // Cash collection entry with timing offset
    if (timingDays > 0) {
      const cashDate = addDays(dateStr, timingDays);
      if (cashDate >= startDate && cashDate <= endDate) {
        entries.push({
          date: cashDate,
          debitAccount: '1000',       // cash
          debitSubAccount: null,
          debitAmount: amount,
          creditAccount: counterAccount,
          creditSubAccount: null,
          creditAmount: amount,
          taxRuleId: null,
          projectId: null,
          labelId: null,
          memo: `${assumption.name} (collection ${cashDate})`,
          sourceType: 'formula',
        });
      }
    }
  }

  return entries;
}

function addDays(dateStr, days) {
  if (!days) return dateStr;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
