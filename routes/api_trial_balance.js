import trial_balance from '../libs/trial_balance.js';
import models from '../models/index.js';
import { trialBalanceV2 } from '../libs/reporting/trial-balance-v2.js';

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
