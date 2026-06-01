import models from '../models/index.js';

const OP = models.Sequelize.Op;

// Mapping from (tableName, fieldName) to Translation.recordKey pattern
const TRANSLATION_MAP = {
  // Master / reference tables
  CompanyClass: { name: (rec) => `name:${rec.name}` },
  ItemClass: { name: (rec) => `name:${rec.name}` },
  TransactionKind: { label: (rec) => `label:${rec.id}-${rec.label}` },
  VoucherClass: { name: (rec) => `name:${rec.name}` },
  TaxRule: { label: (rec) => `label:${rec.id}-${rec.label}` },
  MemberClass: { title: (rec) => `title:${rec.title}` },
  AccountClass: {
    major: (rec) => `major:${rec.major}`,
    middle: (rec) => `middle:${rec.middle}`,
    minor: (rec) => `minor:${rec.minor}`
  }
};

/**
 * Enrich a batch of master data records with translated values.
 *
 * @param {string} tableName - e.g. 'CompanyClass', 'ItemClass'
 * @param {Array} records - Array of Sequelize model instances
 * @param {object} languagePair - { primary: 'ja', secondary: 'vi' }
 * @returns {Array} Same records, each mutated with `{fieldName}Secondary` fields
 */
export async function enrichBilingual(tableName, records, languagePair) {
  if (!records || records.length === 0) return records;
  const mapping = TRANSLATION_MAP[tableName];
  if (!mapping) return records;

  const secondary = languagePair?.secondary;
  if (!secondary) return records;

  const fieldNames = Object.keys(mapping);
  const keys = new Set();
  for (const rec of records) {
    for (const field of fieldNames) {
      keys.add(mapping[field](rec));
    }
  }

  const rows = await models.Translation.findAll({
    where: {
      tableName,
      recordKey: [...keys],
      field: fieldNames,
      language: secondary,
      tenantId: null // System seed only
    },
    raw: true
  });

  // Build lookup: { recordKey: { field: value } }
  const lookup = {};
  for (const row of rows) {
    const rk = row.recordKey;
    const field = row.field;
    if (!lookup[rk]) lookup[rk] = {};
    lookup[rk][field] = row.value;
  }

  for (const rec of records) {
    for (const field of fieldNames) {
      const rk = mapping[field](rec);
      const translated = lookup[rk]?.[field];
      if (translated) {
        rec.setDataValue(`${field}${secondary.charAt(0).toUpperCase() + secondary.slice(1)}`, translated);
      }
    }
  }

  return records;
}

export default { enrichBilingual, TRANSLATION_MAP };
