const ANY = 'any';

const PUBLIC_PATHS = [
  { match: /^\/user\/login$/, method: 'POST' },
  { match: /^\/user\/signup$/, method: 'POST' },
  { match: /^\/user\/session-status$/, method: 'GET' },
  { match: /^\/version$/, method: 'GET' }
];

const RULES = [
  // User profile & tenant selection / management
  { match: /^\/user\/language-pair$/, methods: ['GET', 'PUT'], access: ANY },
  { match: /^\/user\/password$/, methods: ['PUT'], access: ANY },
  { match: /^\/user\/profile$/, methods: ['PUT'], access: ANY },
  { match: /^\/user\/logoff$/, methods: ['POST'], access: ANY },
  { match: /^\/user\/tenants$/, methods: ['GET'], access: ANY },
  { match: /^\/user\/select-tenant$/, methods: ['POST'], access: ANY },
  { match: /^\/user\/tenant(\/\d+)?$/, methods: ['POST', 'PUT', 'DELETE'], access: ANY },
  { match: /^\/tenant$/, methods: ['POST'], access: ANY },
  { match: /^\/user$/, methods: ['GET'], access: ANY },
  { match: /^\/user\/\d+$/, methods: ['GET'], access: ANY },
  { match: /^\/user\/\d+$/, methods: ['PUT', 'DELETE'], access: ['administrable'] },
  { match: /^\/users\/member$/, methods: ['GET'], access: ['administrable', 'personnelManagement'] },
  { match: /^\/users(\/\d+)?$/, methods: ['GET'], access: ['administrable', 'personnelManagement'] },

  // Accounts & SubAccounts
  { match: /^\/accounts\/?$/, methods: ['GET'], access: ANY },
  { match: /^\/accounts2\/.+$/, methods: ['GET'], access: ANY },
  { match: /^\/accounts4\/.+$/, methods: ['GET'], access: ANY },
  { match: /^\/accounts3\/.+$/, methods: ['GET'], access: ['accounting', 'fiscalBrowsing'] },
  { match: /^\/account\/.+$/, methods: ['GET'], access: ANY },
  { match: /^\/account-class\/.+$/, methods: ['GET'], access: ANY },
  { match: /^\/account\/.+$/, methods: ['POST', 'PUT', 'DELETE'], access: ['accounting'] },
  { match: /^\/sub_account\/.+$/, methods: ['POST', 'PUT', 'DELETE'], access: ['accounting'] },

  // Company / Partner
  { match: /^\/company\/info$/, methods: ['GET'], access: ANY },
  { match: /^\/company\/info$/, methods: ['PUT'], access: ['companyManagement', 'accounting'] },
  { match: /^\/company\/kinds$/, methods: ['GET'], access: ANY },
  { match: /^\/company\/kinds$/, methods: ['PUT'], access: ['companyManagement', 'accounting'] },
  { match: /^\/company(\/\d+)?$/, methods: ['GET'], access: ANY },
  { match: /^\/company(\/\d+)?$/, methods: ['POST', 'PUT', 'DELETE'], access: ['companyManagement', 'accounting'] },

  // Vouchers
  { match: /^\/voucher\/classes$/, methods: ['GET'], access: ANY },
  { match: /^\/voucher\/classes$/, methods: ['PUT'], access: ['accounting'] },
  { match: /^\/voucher\/files\/\d+$/, methods: ['GET'], access: ANY },
  { match: /^\/voucher\/upload(\/\d+)?$/, methods: ['POST'], access: ANY },
  { match: /^\/voucher\/bind$/, methods: ['PUT'], access: ANY },
  { match: /^\/voucher\/file$/, methods: ['DELETE'], access: ANY },
  { match: /^\/voucher(\/\d+)?$/, methods: ['GET', 'POST', 'PUT', 'DELETE'], access: ANY },

  // Cross Slips & Details
  { match: /^\/cross_slip\/approve$/, methods: ['PUT'], access: ['approvable'] },
  { match: /^\/cross_slip\/\d+\/\d+\/\d+$/, methods: ['GET'], access: ['accounting', 'fiscalBrowsing'] },
  { match: /^\/cross_slips\/.+$/, methods: ['GET'], access: ANY },
  { match: /^\/cross_slip$/, methods: ['POST', 'PUT'], access: ANY },
  { match: /^\/cross_slip$/, methods: ['DELETE'], access: ['approvable'] },
  { match: /^\/cross-slip-detail\/\d+$/, methods: ['GET'], access: ['accounting', 'fiscalBrowsing'] },
  { match: /^\/cross-slip-detail$/, methods: ['PUT'], access: ['accounting'] },

  // Financial reporting & Ledgers
  { match: /^\/journal/, access: ['accounting', 'fiscalBrowsing'] },
  { match: /^\/ledger/, access: ['accounting', 'fiscalBrowsing'] },
  { match: /^\/remaining/, access: ['accounting', 'fiscalBrowsing'] },
  { match: /^\/trial-balance/, access: ['accounting', 'fiscalBrowsing'] },
  { match: /^\/changes/, access: ['accounting', 'fiscalBrowsing'] },
  { match: /^\/closing/, access: ['accounting', 'fiscalBrowsing'] },
  { match: /^\/simulation/, access: ['accounting', 'fiscalBrowsing'] },

  // Tax rules & Terms
  { match: /^\/tax-rule/, methods: ['GET'], access: ANY },
  { match: /^\/tax-rule/, methods: ['PUT'], access: ['accounting'] },
  { match: /^\/term\/\d+$/, methods: ['PUT'], access: ['accounting'] },
  { match: /^\/term/, methods: ['GET'], access: ANY },

  // Transaction / Task / Document / Item
  { match: /^\/transaction/, access: ['companyManagement', 'accounting'] },
  { match: /^\/task/, access: ['companyManagement', 'accounting'] },
  { match: /^\/document/, access: ['companyManagement', 'accounting'] },
  { match: /^\/item\/classes$/, methods: ['GET'], access: ANY },
  { match: /^\/item\/classes$/, methods: ['PUT'], access: ['companyManagement', 'accounting'] },
  { match: /^\/item(\/\d+)?$/, methods: ['GET'], access: ANY },
  { match: /^\/item(\/\d+)?$/, methods: ['POST', 'PUT', 'DELETE'], access: ['companyManagement', 'accounting'] },

  // Projects & Labels
  { match: /^\/projects$/, methods: ['GET'], access: ANY },
  { match: /^\/project/, access: ['companyManagement', 'accounting'] },
  { match: /^\/labels/, access: ['companyManagement', 'accounting'] },
  { match: /^\/label/, access: ['companyManagement', 'accounting'] },
  { match: /^\/project-summary/, access: ['companyManagement', 'accounting'] },

  // Members & Admin
  { match: /^\/member/, methods: ['GET'], access: ['administrable', 'personnelManagement'] },
  { match: /^\/member/, methods: ['POST', 'PUT', 'DELETE'], access: ['administrable', 'personnelManagement'] },
  { match: /^\/menu/, methods: ['GET'], access: ANY },
  { match: /^\/menu/, methods: ['POST', 'PUT', 'DELETE'], access: ['administrable'] },
  { match: /^\/admin/, access: ['administrable'] },
  { match: /^\/setup$/, methods: ['POST'], access: ANY },

  // Extended ERP modules
  { match: /^\/registry/, access: ['companyManagement', 'accounting'] },
  { match: /^\/attendance/, access: ['personnelManagement', 'administrable'] },
  { match: /^\/payroll/, access: ['personnelManagement', 'accounting', 'administrable'] },
  { match: /^\/expense/, access: ANY }
];

const isPublic = (req) => {
  return PUBLIC_PATHS.some((p) => p.match.test(req.path) && p.method === req.method);
};

const hasRole = (user, access) => {
  if (!user) return false;
  if (user.isOwner) return true;
  return access.some((role) => Boolean(user[role]));
};

export const guard = (req, res, next) => {
  if (isPublic(req)) {
    return next();
  }
  if (!req.session || !req.session.user) {
    return res.status(401).json({ code: -10, message: 'not authenticated' });
  }
  const user = req.session.user;
  for (const rule of RULES) {
    if (rule.methods && rule.methods.indexOf(req.method) < 0) {
      continue;
    }
    if (!rule.match.test(req.path)) {
      continue;
    }
    if (rule.access === ANY) {
      return next();
    }
    if (hasRole(user, rule.access)) {
      return next();
    }
    return res.status(403).json({ code: -10, message: 'permission denied' });
  }
  res.status(403).json({ code: -10, message: 'permission denied' });
};

export default {
  guard,
  RULES,
  PUBLIC_PATHS
};
