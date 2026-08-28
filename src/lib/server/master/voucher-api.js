import models from '$lib/server/db/index.js';
import { numeric } from '$lib/utils.js';
import { loadTaxContext, computeVoucherTax } from '$lib/server/tax-calc.js';
import { asJson } from '$lib/server/api-guard.js';

const Op = models.Sequelize.Op;

const voucherInclude = (tenantId) => [
  { model: models.Company, as: 'company', where: { tenantId }, required: false },
  { model: models.User, as: 'updateUser' },
  { model: models.VoucherClass, as: 'voucherClass', where: { tenantId }, required: false },
  { model: models.TaxRule, as: 'taxRule', where: { tenantId }, required: false }
];

export async function getVoucherFiles(voucherId, tenantId) {
  const files = await models.VoucherFile.findAll({
    where: { voucherId, tenantId },
    attributes: { exclude: ['body'] }
  });
  const out = [];
  for (const file of files) {
    const rec = asJson(file);
    if (file.mimeType && String(file.mimeType).startsWith('image/')) {
      const full = await models.VoucherFile.findOne({
        where: { id: file.id, tenantId }
      });
      rec.body = full?.body ? Buffer.from(full.body).toString('base64') : '';
    } else {
      rec.body = '';
    }
    out.push(rec);
  }
  return out;
}

async function attachDetails(voucher, tenantId) {
  const details = await models.CrossSlipDetail.findAll({
    where: {
      tenantId,
      [Op.or]: [{ debitVoucherId: voucher.id }, { creditVoucherId: voucher.id }]
    },
    include: [{ model: models.CrossSlip, as: 'crossSlip' }]
  });
  voucher.details = details.map(asJson);
  return voucher;
}

async function fiscalYear(tenantId, term) {
  const where = { tenantId };
  if (term != null && term !== '') where.term = term;
  return models.FiscalYear.findOne({
    where,
    order: [['term', 'DESC']]
  });
}

export async function prepareVoucherBody(body, tenantId) {
  if (!body.companyId) {
    return { ok: false, status: 422, payload: { code: -2, message: '相手先が未入力もしくは、取引先に存在しない相手先が入力されました。' } };
  }
  const company = await models.Company.findOne({
    where: { id: body.companyId, tenantId }
  });
  if (!company) {
    return { ok: false, status: 422, payload: { code: -2, message: '相手先が未入力もしくは、取引先に存在しない相手先が入力されました。' } };
  }
  const issueDate = body.issueDate ? new Date(body.issueDate) : new Date();
  const ctx = await loadTaxContext(issueDate.getFullYear(), issueDate.getMonth() + 1, tenantId);
  if (body.amount) {
    body.amount = numeric(body.amount);
    body.tax = body.taxRuleId ? computeVoucherTax(body.amount, body.taxRuleId, ctx) : 0;
  }
  return { ok: true };
}

export async function listVouchers(tenantId, query, term) {
  let where = { tenantId };
  const order = [['issueDate', 'ASC']];

  if (query.date) {
    const date = new Date(query.date);
    where = {
      [Op.and]: [
        where,
        { [Op.or]: [{ issueDate: { [Op.eq]: date } }, { paymentDate: { [Op.eq]: date } }] }
      ]
    };
  } else if (query.month) {
    const ymd = String(query.month).split('-');
    const fromDate = new Date(parseInt(ymd[0], 10), parseInt(ymd[1], 10) - 1, 1);
    const toDate = new Date(parseInt(ymd[0], 10), parseInt(ymd[1], 10), 1);
    where = {
      [Op.and]: [
        where,
        {
          [Op.or]: [
            { [Op.and]: [{ issueDate: { [Op.gte]: fromDate } }, { issueDate: { [Op.lt]: toDate } }] },
            { [Op.and]: [{ paymentDate: { [Op.gte]: fromDate } }, { paymentDate: { [Op.lt]: toDate } }] }
          ]
        }
      ]
    };
  } else {
    const fy = await fiscalYear(tenantId, term);
    if (fy) {
      where = {
        [Op.and]: [
          where,
          { issueDate: { [Op.gte]: new Date(fy.startDate) } },
          { issueDate: { [Op.lte]: new Date(fy.endDate) } }
        ]
      };
    }
  }

  if (query.type) {
    const type = parseInt(query.type, 10);
    if (type > 0) where = { [Op.and]: [where, { voucherClassId: type }] };
  }
  if (query.company) {
    where = { [Op.and]: [where, { companyId: parseInt(query.company, 10) }] };
  }
  if (query.upper) {
    if (query.lower) {
      where = {
        [Op.and]: [
          where,
          { amount: { [Op.gte]: parseInt(query.lower, 10) } },
          { amount: { [Op.lte]: parseInt(query.upper, 10) } }
        ]
      };
    } else {
      where = { [Op.and]: [where, { amount: { [Op.lte]: parseInt(query.upper, 10) } }] };
    }
  } else if (query.lower) {
    where = { [Op.and]: [where, { amount: { [Op.gte]: parseInt(query.lower, 10) } }] };
  }

  const rows = await models.Voucher.findAll({
    where,
    order,
    include: voucherInclude(tenantId),
    distinct: true
  });

  const vouchers = [];
  for (const row of rows) {
    const voucher = asJson(row);
    voucher.files = await getVoucherFiles(voucher.id, tenantId);
    await attachDetails(voucher, tenantId);
    vouchers.push(voucher);
  }
  return { code: 0, vouchers };
}

export async function getVoucher(tenantId, id) {
  const row = await models.Voucher.findOne({
    where: { id, tenantId },
    include: voucherInclude(tenantId)
  });
  if (!row) return null;
  const voucher = asJson(row);
  await attachDetails(voucher, tenantId);
  return { code: 0, voucher };
}

export async function createVoucher(tenantId, userId, body) {
  const prepared = { ...body, createdBy: userId, updatedBy: userId, tenantId };
  const check = await prepareVoucherBody(prepared, tenantId);
  if (!check.ok) return check;
  const voucher = await models.Voucher.create(prepared);
  return { ok: true, payload: { code: 0, voucher: asJson(voucher) } };
}

export async function updateVoucher(tenantId, user, body, id) {
  const voucherId = id || body.id;
  const prepared = { ...body, updatedBy: user.id };
  const check = await prepareVoucherBody(prepared, tenantId);
  if (!check.ok) return check;
  const voucher = await models.Voucher.findOne({ where: { id: voucherId, tenantId } });
  if (!voucher) return { ok: false, status: 404, payload: { code: -1 } };
  if (!user.accounting && voucher.createdBy !== user.id) {
    return { ok: false, status: 403, payload: { code: -10, message: 'permission denied' } };
  }
  voucher.set({ ...prepared, tenantId });
  await voucher.save();
  return { ok: true, payload: { voucher: asJson(voucher) } };
}

export async function deleteVoucher(tenantId, user, id) {
  const voucher = await models.Voucher.findOne({ where: { id, tenantId } });
  if (!voucher) return { ok: false, status: 404, payload: { code: -2 } };
  if (!user.accounting && voucher.createdBy !== user.id) {
    return { ok: false, status: 403, payload: { code: -10, message: 'permission denied' } };
  }
  await voucher.destroy();
  return { ok: true, payload: { code: 0 } };
}
