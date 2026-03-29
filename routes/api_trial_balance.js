import trial_balance from '../libs/trial_balance.js';
import models from '../models/index.js';

export default {
  get: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    try {
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
      let ret;
      if (ym) {
        const year = parseInt(ym[0]);
        const monthIndex = parseInt(ym[1]) - 1;
        lastDate = new Date(year, monthIndex + 1, 0);
        ret = await trial_balance(tenantId, term, lastDate, { monthly: true });
      } else {
        const fy = await models.FiscalYear.findOne({ where: { tenantId, term: term }});
        if (!fy) {
          return res.status(404).json({ error: `Fiscal year for term ${term} not found.` });
        }
        lastDate = new Date(fy.endDate);
        ret = await trial_balance(tenantId, term, lastDate);
      }

      res.json(ret.lines);
    } catch(err) {
      next(err);
    }
  },
}