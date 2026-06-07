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
