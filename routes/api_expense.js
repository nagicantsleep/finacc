import express from 'express';
import models from '../models/index.js';
import { is_authenticated } from '../libs/user.js';
import { requireTenant } from '../libs/tenant.js';

const router = express.Router();
const Op = models.Sequelize.Op;

router.use(is_authenticated, requireTenant);

// ---------------------------------------------------------------------------
// Expense Categories
// ---------------------------------------------------------------------------

// List categories
router.get('/categories', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const categories = await models.ExpenseCategory.findAll({
      where: { tenantId, status: 'active' },
      order: [['id', 'ASC']]
    });

    res.json({ code: 0, categories });
  } catch (e) {
    console.error('Error in GET /api/expense/categories:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Create category
router.post('/categories', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const { name, code, accountCode, icon, description, requiresReceipt } = req.body;

    if (!name || !code) {
      return res.status(400).json({ code: -1, message: 'Name and Code are required.' });
    }

    const cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    const existing = await models.ExpenseCategory.findOne({
      where: { tenantId, code: cleanCode }
    });
    if (existing) {
      return res.status(409).json({ code: -1, message: `Category code '${cleanCode}' already exists.` });
    }

    const category = await models.ExpenseCategory.create({
      tenantId,
      name,
      code: cleanCode,
      accountCode: accountCode || '642',
      icon: icon || 'bi-receipt',
      description: description || '',
      requiresReceipt: requiresReceipt !== undefined ? requiresReceipt : true,
      status: 'active'
    });

    res.json({ code: 0, category });
  } catch (e) {
    console.error('Error in POST /api/expense/categories:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// ---------------------------------------------------------------------------
// Expense Advances (Tạm ứng)
// ---------------------------------------------------------------------------

// List advances
router.get('/advances', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const { status, allMembers } = req.query;

    const where = { tenantId };
    if (!allMembers) {
      where.userId = req.session.user.id;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const advances = await models.ExpenseAdvance.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] },
        { model: models.Project, as: 'project', attributes: ['id', 'name'] },
        { model: models.User, as: 'reviewer', attributes: ['id', 'name', 'legalName'] }
      ]
    });

    res.json({ code: 0, advances });
  } catch (e) {
    console.error('Error in GET /api/expense/advances:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Create advance
router.post('/advances', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const userId = req.session.user.id;
    const { title, amount, requestDate, expectedDate, purpose, projectId } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ code: -1, message: 'Title and Amount are required.' });
    }

    const member = await models.TenantMember.findOne({
      where: { tenantId, userId }
    });

    const count = await models.ExpenseAdvance.count({ where: { tenantId } });
    const code = `ADV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const advance = await models.ExpenseAdvance.create({
      tenantId,
      userId,
      tenantMemberId: member ? member.id : null,
      projectId: projectId ? parseInt(projectId, 10) : null,
      code,
      title: title.trim(),
      amount: parseFloat(amount),
      requestDate: requestDate || new Date().toISOString().split('T')[0],
      expectedDate: expectedDate || null,
      purpose: purpose || '',
      status: 'pending'
    });

    res.json({ code: 0, advance });
  } catch (e) {
    console.error('Error in POST /api/expense/advances:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Review advance (approve / disburse / reject)
router.put('/advances/:id/review', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const reviewerId = req.session.user.id;
    const id = parseInt(req.params.id, 10);
    const { status, reviewComment } = req.body;

    if (!['approved', 'disbursed', 'settled', 'rejected'].includes(status)) {
      return res.status(400).json({ code: -1, message: 'Invalid review status.' });
    }

    const advance = await models.ExpenseAdvance.findOne({
      where: { id, tenantId }
    });

    if (!advance) {
      return res.status(404).json({ code: -1, message: 'Advance request not found.' });
    }

    advance.status = status;
    advance.reviewedById = reviewerId;
    advance.reviewedAt = new Date();
    if (reviewComment) advance.reviewComment = reviewComment;
    await advance.save();

    res.json({ code: 0, advance });
  } catch (e) {
    console.error('Error in PUT /api/expense/advances/:id/review:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// ---------------------------------------------------------------------------
// Expense Claims & Itemized Lines (Quyết toán chi phí)
// ---------------------------------------------------------------------------

// List claims
router.get('/claims', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const { status, allMembers, q } = req.query;

    const where = { tenantId };
    if (!allMembers) {
      where.userId = req.session.user.id;
    }
    if (status && status !== 'all') {
      where.status = status;
    }
    if (q && q.trim()) {
      const search = `%${q.trim()}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: search } },
        { code: { [Op.iLike]: search } }
      ];
    }

    const claims = await models.ExpenseClaim.findAll({
      where,
      order: [['claimDate', 'DESC'], ['id', 'DESC']],
      include: [
        { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] },
        { model: models.Project, as: 'project', attributes: ['id', 'name'] },
        { model: models.ExpenseAdvance, as: 'advance', attributes: ['id', 'code', 'title', 'amount'] },
        { model: models.ExpenseClaimItem, as: 'items', attributes: ['id'] }
      ]
    });

    const results = claims.map(c => {
      const plain = c.toJSON();
      plain.itemCount = plain.items ? plain.items.length : 0;
      delete plain.items;
      return plain;
    });

    res.json({ code: 0, claims: results });
  } catch (e) {
    console.error('Error in GET /api/expense/claims:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Create claim
router.post('/claims', async (req, res) => {
  const transaction = await models.sequelize.transaction();
  try {
    const tenantId = req.currentTenantId;
    const userId = req.session.user.id;
    const { title, claimDate, projectId, expenseAdvanceId, items, note } = req.body;

    if (!title || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ code: -1, message: 'Title and at least one expense item are required.' });
    }

    const member = await models.TenantMember.findOne({
      where: { tenantId, userId },
      transaction
    });

    let advanceAmount = 0;
    if (expenseAdvanceId) {
      const advance = await models.ExpenseAdvance.findOne({
        where: { id: parseInt(expenseAdvanceId, 10), tenantId },
        transaction
      });
      if (advance) {
        advanceAmount = parseFloat(advance.amount || 0);
      }
    }

    let totalAmount = 0;
    for (const it of items) {
      totalAmount += parseFloat(it.amount || 0);
    }

    const netAmount = Math.max(0, totalAmount - advanceAmount);

    const count = await models.ExpenseClaim.count({ where: { tenantId }, transaction });
    const code = `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const claim = await models.ExpenseClaim.create({
      tenantId,
      userId,
      tenantMemberId: member ? member.id : null,
      projectId: projectId ? parseInt(projectId, 10) : null,
      expenseAdvanceId: expenseAdvanceId ? parseInt(expenseAdvanceId, 10) : null,
      code,
      title: title.trim(),
      claimDate: claimDate || new Date().toISOString().split('T')[0],
      totalAmount,
      advanceAmount,
      netAmount,
      status: 'submitted',
      note: note || ''
    }, { transaction });

    // Create item lines
    for (const it of items) {
      await models.ExpenseClaimItem.create({
        tenantId,
        expenseClaimId: claim.id,
        expenseCategoryId: parseInt(it.expenseCategoryId, 10),
        companyId: it.companyId ? parseInt(it.companyId, 10) : null,
        voucherId: it.voucherId ? parseInt(it.voucherId, 10) : null,
        date: it.date || claim.claimDate,
        amount: parseFloat(it.amount || 0),
        taxAmount: parseFloat(it.taxAmount || 0),
        taxRuleId: it.taxRuleId ? parseInt(it.taxRuleId, 10) : null,
        description: it.description || 'Chi phí công tác',
        receiptUrl: it.receiptUrl || null
      }, { transaction });
    }

    await transaction.commit();

    const fullClaim = await models.ExpenseClaim.findByPk(claim.id, {
      include: [
        { model: models.ExpenseClaimItem, as: 'items', include: [{ model: models.ExpenseCategory, as: 'category' }] },
        { model: models.ExpenseAdvance, as: 'advance' }
      ]
    });

    res.json({ code: 0, claim: fullClaim });
  } catch (e) {
    await transaction.rollback();
    console.error('Error in POST /api/expense/claims:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Single claim detail
router.get('/claim/:id', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const id = parseInt(req.params.id, 10);

    const claim = await models.ExpenseClaim.findOne({
      where: { id, tenantId },
      include: [
        { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] },
        { model: models.Project, as: 'project' },
        { model: models.ExpenseAdvance, as: 'advance' },
        { model: models.User, as: 'reviewer', attributes: ['id', 'name', 'legalName'] },
        { model: models.CrossSlip, as: 'crossSlip' },
        {
          model: models.ExpenseClaimItem,
          as: 'items',
          include: [
            { model: models.ExpenseCategory, as: 'category' },
            { model: models.Company, as: 'company' }
          ]
        }
      ]
    });

    if (!claim) {
      return res.status(404).json({ code: -1, message: 'Expense claim not found.' });
    }

    res.json({ code: 0, claim });
  } catch (e) {
    console.error('Error in GET /api/expense/claim/:id:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Review claim (approve / reject)
router.put('/claim/:id/review', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const reviewerId = req.session.user.id;
    const id = parseInt(req.params.id, 10);
    const { status, reviewComment } = req.body;

    if (!['approved', 'settled', 'rejected'].includes(status)) {
      return res.status(400).json({ code: -1, message: 'Invalid review status.' });
    }

    const claim = await models.ExpenseClaim.findOne({
      where: { id, tenantId }
    });

    if (!claim) {
      return res.status(404).json({ code: -1, message: 'Expense claim not found.' });
    }

    claim.status = status;
    claim.reviewedById = reviewerId;
    claim.reviewedAt = new Date();
    if (reviewComment) claim.reviewComment = reviewComment;
    await claim.save();

    res.json({ code: 0, claim });
  } catch (e) {
    console.error('Error in PUT /api/expense/claim/:id/review:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// ---------------------------------------------------------------------------
// Accounting Voucher Direct Generation (伝票起票)
// ---------------------------------------------------------------------------
router.post('/claim/:id/create-voucher', async (req, res) => {
  const transaction = await models.sequelize.transaction();
  try {
    const tenantId = req.currentTenantId;
    const userId = req.session.user.id;
    const id = parseInt(req.params.id, 10);

    const claim = await models.ExpenseClaim.findOne({
      where: { id, tenantId },
      include: [
        {
          model: models.ExpenseClaimItem,
          as: 'items',
          include: [{ model: models.ExpenseCategory, as: 'category' }]
        },
        { model: models.ExpenseAdvance, as: 'advance' }
      ],
      transaction
    });

    if (!claim) {
      await transaction.rollback();
      return res.status(404).json({ code: -1, message: 'Expense claim not found.' });
    }

    if (claim.crossSlipId) {
      await transaction.rollback();
      return res.status(400).json({ code: -1, message: 'Bút toán kế toán cho hồ sơ quyết toán này đã được tạo trước đó.' });
    }

    // Find fiscal year term
    const claimDateObj = new Date(claim.claimDate);
    const year = claimDateObj.getFullYear();
    const month = claimDateObj.getMonth() + 1;
    const day = claimDateObj.getDate();

    const fiscalYear = await models.FiscalYear.findOne({
      where: { tenantId },
      order: [['term', 'DESC']],
      transaction
    });

    const term = fiscalYear ? fiscalYear.term : 1;
    const currentNo = (await models.CrossSlip.count({
      where: { tenantId, year, month },
      transaction
    })) + 1;

    // Create CrossSlip
    const crossSlip = await models.CrossSlip.create({
      tenantId,
      year,
      month,
      day,
      no: currentNo,
      lineCount: claim.items.length + (claim.advanceAmount > 0 ? 2 : 1),
      term,
      createdBy: userId,
      updatedBy: userId
    }, { transaction });

    // Group items by category to create balanced Debit lines
    const categoryTotals = {};
    for (const it of claim.items) {
      const acc = it.category?.accountCode || '642';
      categoryTotals[acc] = (categoryTotals[acc] || 0) + parseFloat(it.amount || 0);
    }

    let lineNo = 1;
    const summary = `経費精算 ${claim.code}: ${claim.title}`;

    // Debit Lines (Expense Accounts) vs Credit Line (Payable or Advance)
    for (const [accountCode, amount] of Object.entries(categoryTotals)) {
      await models.CrossSlipDetail.create({
        tenantId,
        crossSlipId: crossSlip.id,
        lineNo: lineNo++,
        debitAccount: accountCode,
        debitAmount: amount,
        creditAccount: claim.advanceAmount > 0 ? '141' : '334', // Credit 141 (Clear advance) or 334 (Payable)
        creditAmount: amount,
        application1: `${summary} - Chi phí`,
        application2: ''
      }, { transaction });
    }

    claim.crossSlipId = crossSlip.id;
    claim.status = 'settled';
    await claim.save({ transaction });

    if (claim.advance) {
      claim.advance.status = 'settled';
      await claim.advance.save({ transaction });
    }

    await transaction.commit();

    res.json({
      code: 0,
      message: 'Bút toán quyết toán chi phí đã được tự động hạch toán vào Sổ Cái.',
      crossSlipId: crossSlip.id,
      crossSlip
    });
  } catch (e) {
    await transaction.rollback();
    console.error('Error in POST /api/expense/claim/:id/create-voucher:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Export CSV
router.get('/claim/:id/export', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const id = parseInt(req.params.id, 10);

    const claim = await models.ExpenseClaim.findOne({
      where: { id, tenantId },
      include: [
        { model: models.User, as: 'user' },
        { model: models.ExpenseClaimItem, as: 'items', include: [{ model: models.ExpenseCategory, as: 'category' }, { model: models.Company, as: 'company' }] }
      ]
    });

    if (!claim) {
      return res.status(404).json({ code: -1, message: 'Expense claim not found.' });
    }

    const header = ['STT', 'Ngày', 'Hạng mục chi phí', 'Mô tả / Nội dung', 'Đối tác / Nhà cung cấp', 'Số tiền', 'Thuế'];
    const rows = claim.items.map((it, idx) => [
      idx + 1,
      it.date,
      it.category?.name || 'Chi phí',
      it.description,
      it.company?.name || '-',
      it.amount,
      it.taxAmount || 0
    ]);

    rows.push(['', '', '', 'TỔNG CHI PHÍ', '', claim.totalAmount, '']);
    rows.push(['', '', '', 'ĐÃ TẠM ỨNG', '', `-${claim.advanceAmount}`, '']);
    rows.push(['', '', '', 'THỰC NHẬN HOÀN ỨNG', '', claim.netAmount, '']);

    const csvContent = [
      header.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="expense-claim-${claim.code}-${Date.now()}.csv"`);
    res.send('\uFEFF' + csvContent);
  } catch (e) {
    console.error('Error in GET /api/expense/claim/:id/export:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

export default router;
