import trial_balance from '../libs/trial_balance.js';
import models from '../models/index.js';
import { trialBalanceV2 } from '../libs/reporting/trial-balance-v2.js';
import { buildSubtotals } from '../libs/reporting/tb-subtotal.js';
import { withAccountParents } from '../libs/reporting/tb-hierarchy.js';
import { buildXlsxBuffer, fileNameFor } from '../libs/reporting/tb-export.js';

const parseBool = (v, dflt = false) => {
  if (v == null) return dflt;
  const s = String(v).toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
};

const parseCsv = (v) => {
  if (v == null || v === '') return [];
  return String(v).split(',').map((x) => x.trim()).filter(Boolean);
};

export default {
  get: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    try {
      // Branch: ?version=2 → new contract (E1.1). Legacy untouched.
      const version = parseInt(req.query.version, 10);
      if (version === 2) {
        let term;
        const param = req.params.param;
        let ym;
        if (param) {
          const params = param.split('-');
          if (params[1]) {
            ym = params;
            if (!req.session || !req.session.term) {
              return res.status(401).json({ error: 'Unauthorized: term not set in session.' });
            }
            term = req.session.term;
          } else {
            term = parseInt(params[0], 10);
          }
        } else {
          if (!req.session || !req.session.term) {
            return res.status(401).json({ error: 'Unauthorized: term not set in session.' });
          }
          term = req.session.term;
        }

        // Query param `month` (YYYY-MM) overrides :param-derived month.
        const month = req.query.month || (ym ? `${ym[0]}-${String(ym[1]).padStart(2, '0')}` : null);
        const reportType = req.query.reportType || 'balance';
        const accountClassIds = parseCsv(req.query.accountClassIds);
        const hideZero = parseBool(req.query.hideZero);
        const includeUnapproved = parseBool(req.query.includeUnapproved, false);
        const lp = req.query.languagePair ? JSON.parse(req.query.languagePair) : req.session?.languagePair;

        const out = await trialBalanceV2(
          {
            tenantId,
            term,
            reportType,
            month,
            accountClassIds,
            hideZero,
            includeUnapproved,
            languagePair: lp,
          },
          models,
        );
        return res.json(out);
      }

      // Branch: ?format=xlsx → Excel export (E1.7). Same v2 contract, but
      // the response is application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
      // with a Content-Disposition file name.
      if (req.query.format === 'xlsx') {
        let term;
        const param = req.params.param;
        let ym;
        if (param) {
          const params = param.split('-');
          if (params[1]) {
            ym = params;
            if (!req.session || !req.session.term) {
              return res.status(401).json({ error: 'Unauthorized: term not set in session.' });
            }
            term = req.session.term;
          } else {
            term = parseInt(params[0], 10);
          }
        } else {
          if (!req.session || !req.session.term) {
            return res.status(401).json({ error: 'Unauthorized: term not set in session.' });
          }
          term = req.session.term;
        }
        const month = req.query.month || (ym ? `${ym[0]}-${String(ym[1]).padStart(2, '0')}` : null);
        const reportType = req.query.reportType || 'balance';
        const accountClassIds = parseCsv(req.query.accountClassIds);
        const hideZero = parseBool(req.query.hideZero);
        const includeUnapproved = parseBool(req.query.includeUnapproved, false);
        const lp = req.query.languagePair ? JSON.parse(req.query.languagePair) : req.session?.languagePair;

        const v2 = await trialBalanceV2(
          {
            tenantId, term, reportType, month,
            accountClassIds, hideZero, includeUnapproved,
            languagePair: lp,
          },
          models,
        );
        // Insert subtotals + parent rows so the sheet renders the 3-level
        // hierarchy the user sees in the UI.
        v2.lines = withAccountParents(buildSubtotals(v2.lines || []));

        // Resolve tenantCode for the file name. Tenant model uses `name`
        // (not `code`); sanitize for filesystem-safe filename.
        const tenant = await models.Tenant.findOne({ where: { id: tenantId } });
        const tenantCode = (tenant?.name || `tenant${tenantId}`).replace(/[^A-Za-z0-9_-]/g, '_');
        const buf = await buildXlsxBuffer(v2, { tenantCode });
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${fileNameFor({ tenantCode, term, when: new Date() })}"`
        );
        return res.send(Buffer.from(buf));
      }

      // Legacy path (no version param, or version=1).
      let term;
      let lastDate;
      const param = req.params.param;
      let ym;
      if  ( param ) {
        const params = param.split('-');
        if  ( params[1] ) {
          ym = params;
          if (!req.session || !req.session.term) {
            return res.status(401).json({ error: 'Unauthorized: term not set in session.' });
          } else {
            term = req.session.term;
          }
        } else {
          term = parseInt(params[0]);
        }
      } else {
        if (!req.session || !req.session.term) {
          return res.status(401).json({ error: 'Unauthorized: term not set in session.' });
        } else {
          term = req.session.term;
        }
      }
      const lp = req.query.languagePair ? JSON.parse(req.query.languagePair) : req.session?.languagePair;
      let ret;
      if (ym) {
        const year = parseInt(ym[0]);
        const monthIndex = parseInt(ym[1]) - 1;
        lastDate = new Date(year, monthIndex + 1, 0);
        ret = await trial_balance(tenantId, term, lastDate, { monthly: true }, lp);
      } else {
        const fy = await models.FiscalYear.findOne({ where: { tenantId, term: term }});
        if (!fy) {
          return res.status(404).json({ error: `Fiscal year for term ${term} not found.` });
        }
        lastDate = new Date(fy.endDate);
        ret = await trial_balance(tenantId, term, lastDate, {}, lp);
      }

      res.json(ret.lines);
    } catch(err) {
      next(err);
    }
  },
}
