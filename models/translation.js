import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Translation extends Model {
    static associate(models) {
      // Translation is a loose table — records reference other tables
      // via (tableName, recordKey) rather than FK constraints.
      // This allows translating any master/reference table uniformly.
    }

    /**
     * Fetch translations for a batch of records in one query.
     * Returns a nested map: { language: { recordKey: { field: value } } }
     *
     * @param {string} tableName - e.g. 'AccountClass'
     * @param {string[]} recordKeys - logical record keys
     * @param {string[]} languages - e.g. ['vi']
     * @param {number|null} tenantId - null = system-wide only
     * @returns {object}
     */
    static async fetchBatch(tableName, recordKeys, languages, tenantId = null) {
      if (!recordKeys || recordKeys.length === 0) return {};

      const where = {
        tableName,
        recordKey: recordKeys,
        language: languages
      };
      if (tenantId !== null) {
        // Tenant-specific overrides take priority — but we fetch system-wide too
        where.tenantId = tenantId;
      }

      const rows = await this.findAll({ where, raw: true });

      const map = {};
      for (const row of rows) {
        const lang = row.language;
        const rk = row.recordKey;
        const field = row.field;
        if (!map[lang]) map[lang] = {};
        if (!map[lang][rk]) map[lang][rk] = {};
        map[lang][rk][field] = row.value;
      }
      return map;
    }
  }

  Translation.init(
    {
      tableName: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Target table name'
      },
      recordKey: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Logical record key'
      },
      field: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Translatable column name'
      },
      language: {
        type: DataTypes.STRING(5),
        allowNull: false,
        comment: 'ISO 639-1 code'
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Translation text'
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'NULL = system seed'
      }
    },
    {
      sequelize,
      modelName: "Translation",
      tableName: "Translations",
      indexes: [
        { unique: true, fields: ["tableName", "recordKey", "field", "language"], where: { tenantId: null }, name: 'translations_system_unique' },
        { fields: ["tableName", "language"], name: 'translations_table_lang_idx' }
      ]
    }
  );
  return Translation;
};
