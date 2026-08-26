import express from 'express';
import models from '../models/index.js';
import { is_authenticated } from '../libs/user.js';
import { requireTenant } from '../libs/tenant.js';

const router = express.Router();
const Op = models.Sequelize.Op;

router.use(is_authenticated, requireTenant);

// ---------------------------------------------------------------------------
// Salary Formulas
// ---------------------------------------------------------------------------

// List formulas
router.get('/formulas', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const formulas = await models.SalaryFormula.findAll({
      where: { tenantId },
      include: [
        { model: models.TenantMember, as: 'member', include: [{ model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] }] },
        { model: models.MemberClass, as: 'memberClass' }
      ]
    });

    res.json({ code: 0, formulas });
  } catch (e) {
    console.error('Error in GET /api/payroll/formulas:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Upsert formula
router.post('/formulas', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const { tenantMemberId, memberClassId, baseSalary, hourlyRate, overtimeMultiplier, allowances, deductions } = req.body;

    if (!tenantMemberId && !memberClassId) {
      return res.status(400).json({ code: -1, message: 'tenantMemberId or memberClassId is required.' });
    }

    const where = { tenantId };
    if (tenantMemberId) where.tenantMemberId = tenantMemberId;
    else where.memberClassId = memberClassId;

    let formula = await models.SalaryFormula.findOne({ where });

    const payload = {
      tenantId,
      tenantMemberId: tenantMemberId || null,
      memberClassId: memberClassId || null,
      baseSalary: parseFloat(baseSalary || 0),
      hourlyRate: parseFloat(hourlyRate || 0),
      overtimeMultiplier: parseFloat(overtimeMultiplier || 1.25),
      allowances: Array.isArray(allowances) ? allowances : [],
      deductions: Array.isArray(deductions) ? deductions : []
    };

    if (!formula) {
      formula = await models.SalaryFormula.create(payload);
    } else {
      await formula.update(payload);
    }

    res.json({ code: 0, formula });
  } catch (e) {
    console.error('Error in POST /api/payroll/formulas:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// ---------------------------------------------------------------------------
// Payroll Periods & Batch Calculation
// ---------------------------------------------------------------------------

// List periods
router.get('/periods', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const periods = await models.PayrollPeriod.findAll({
      where: { tenantId },
      order: [
        ['year', 'DESC'],
        ['month', 'DESC']
      ],
      include: [
        { model: models.CrossSlip, as: 'crossSlip', attributes: ['id', 'no', 'year', 'month'] },
        { model: models.PayrollSlip, as: 'slips', attributes: ['id'] }
      ]
    });

    const results = periods.map(p => {
      const plain = p.toJSON();
      plain.slipCount = plain.slips ? plain.slips.length : 0;
      delete plain.slips;
      return plain;
    });

    res.json({ code: 0, periods: results });
  } catch (e) {
    console.error('Error in GET /api/payroll/periods:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Create period
router.post('/periods', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const { year, month, startDate, endDate, paymentDate } = req.body;

    if (!year || !month) {
      return res.status(400).json({ code: -1, message: 'Year and Month are required.' });
    }

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const lastDay = new Date(y, m, 0).getDate();
    const start = startDate || `${y}-${String(m).padStart(2, '0')}-01`;
    const end = endDate || `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const existing = await models.PayrollPeriod.findOne({
      where: { tenantId, year: y, month: m }
    });
    if (existing) {
      return res.status(409).json({ code: -1, message: `Kỳ lương ${y}年${m}月 đã tồn tại.` });
    }

    const period = await models.PayrollPeriod.create({
      tenantId,
      year: y,
      month: m,
      startDate: start,
      endDate: end,
      paymentDate: paymentDate || null,
      status: 'draft'
    });

    res.json({ code: 0, period });
  } catch (e) {
    console.error('Error in POST /api/payroll/periods:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Batch calculate payroll for period
router.post('/periods/:id/calculate', async (req, res) => {
  const transaction = await models.sequelize.transaction();
  try {
    const tenantId = req.currentTenantId;
    const periodId = parseInt(req.params.id, 10);

    const period = await models.PayrollPeriod.findOne({
      where: { id: periodId, tenantId },
      transaction
    });

    if (!period) {
      await transaction.rollback();
      return res.status(404).json({ code: -1, message: 'Payroll period not found.' });
    }

    // Fetch all active tenant members
    const members = await models.TenantMember.findAll({
      where: { tenantId, status: 'active' },
      include: [
        { model: models.User, as: 'user' },
        { model: models.MemberClass, as: 'memberClass' }
      ],
      transaction
    });

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const member of members) {
      // Find matching formula: specific member formula > class formula > default fallback
      let formula = await models.SalaryFormula.findOne({
        where: { tenantId, tenantMemberId: member.id },
        transaction
      });
      if (!formula && member.memberClassId) {
        formula = await models.SalaryFormula.findOne({
          where: { tenantId, memberClassId: member.memberClassId },
          transaction
        });
      }

      const baseSalary = formula ? parseFloat(formula.baseSalary || 0) : 3000000;
      const hourlyRate = formula && formula.hourlyRate > 0
        ? parseFloat(formula.hourlyRate)
        : Math.round(baseSalary / 160);
      const overtimeMultiplier = formula ? parseFloat(formula.overtimeMultiplier || 1.25) : 1.25;

      // Attendance records in this period
      let attendanceWhere = {
        tenantId,
        date: { [Op.between]: [period.startDate, period.endDate] }
      };
      if (member.userId) {
        attendanceWhere.userId = member.userId;
      } else {
        attendanceWhere.tenantMemberId = member.id;
      }

      const attendances = await models.AttendanceRecord.findAll({
        where: attendanceWhere,
        transaction
      });

      let workingDays = 0;
      let workHours = 0;
      let overtimeHours = 0;
      let leaveDays = 0;

      for (const a of attendances) {
        if (a.clockIn) {
          workingDays += 1;
          workHours += parseFloat(a.workHours || 0);
          overtimeHours += parseFloat(a.overtimeHours || 0);
        }
        if (a.status === 'leave') {
          leaveDays += 1;
        }
      }

      // If no attendance records found (e.g. standard monthly fixed salary), default to 20 days / 160h
      if (workingDays === 0 && attendances.length === 0) {
        workingDays = 20;
        workHours = 160.0;
      }

      const overtimePay = Math.round(overtimeHours * hourlyRate * overtimeMultiplier);

      // Compute allowances
      let allowancesTotal = 0;
      const allowancesDetail = {};
      if (formula && Array.isArray(formula.allowances)) {
        for (const al of formula.allowances) {
          const amt = parseFloat(al.amount || 0);
          allowancesTotal += amt;
          allowancesDetail[al.key || al.name] = amt;
        }
      }

      const grossPay = Math.round(baseSalary + overtimePay + allowancesTotal);

      // Compute deductions
      let deductionsTotal = 0;
      const deductionsDetail = {};
      if (formula && Array.isArray(formula.deductions)) {
        for (const de of formula.deductions) {
          let amt = 0;
          if (de.amount) amt = parseFloat(de.amount);
          else if (de.rate) amt = Math.round(grossPay * parseFloat(de.rate));
          deductionsTotal += amt;
          deductionsDetail[de.key || de.name] = amt;
        }
      } else {
        // Standard statutory deductions: Health Ins (5%), Pension (8%)
        const healthIns = Math.round(grossPay * 0.05);
        const pension = Math.round(grossPay * 0.08);
        deductionsTotal = healthIns + pension;
        deductionsDetail['health_insurance'] = healthIns;
        deductionsDetail['pension_insurance'] = pension;
      }

      const netPay = Math.max(0, grossPay - deductionsTotal);

      totalGross += grossPay;
      totalDeductions += deductionsTotal;
      totalNet += netPay;

      // Upsert PayrollSlip
      const slipData = {
        tenantId,
        payrollPeriodId: period.id,
        tenantMemberId: member.id,
        userId: member.userId || null,
        workingDays,
        workHours,
        overtimeHours,
        leaveDays,
        basePay: baseSalary,
        overtimePay,
        allowancesDetail,
        allowancesTotal,
        grossPay,
        deductionsDetail,
        deductionsTotal,
        netPay,
        status: 'calculated'
      };

      const existingSlip = await models.PayrollSlip.findOne({
        where: { tenantId, payrollPeriodId: period.id, tenantMemberId: member.id },
        transaction
      });

      if (existingSlip) {
        await existingSlip.update(slipData, { transaction });
      } else {
        await models.PayrollSlip.create(slipData, { transaction });
      }
    }

    period.totalGrossPay = totalGross;
    period.totalDeductions = totalDeductions;
    period.totalNetPay = totalNet;
    period.status = 'calculated';
    await period.save({ transaction });

    await transaction.commit();

    const slips = await models.PayrollSlip.findAll({
      where: { tenantId, payrollPeriodId: period.id },
      include: [
        { model: models.TenantMember, as: 'member', include: [{ model: models.User, as: 'user', attributes: ['name', 'legalName'] }] }
      ]
    });

    res.json({ code: 0, period, slips });
  } catch (e) {
    await transaction.rollback();
    console.error('Error in POST /api/payroll/periods/:id/calculate:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Get slips for period
router.get('/periods/:id/slips', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const periodId = parseInt(req.params.id, 10);

    const period = await models.PayrollPeriod.findOne({
      where: { id: periodId, tenantId },
      include: [{ model: models.CrossSlip, as: 'crossSlip' }]
    });

    if (!period) {
      return res.status(404).json({ code: -1, message: 'Payroll period not found.' });
    }

    const slips = await models.PayrollSlip.findAll({
      where: { tenantId, payrollPeriodId: periodId },
      include: [
        {
          model: models.TenantMember,
          as: 'member',
          include: [
            { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] },
            { model: models.MemberClass, as: 'memberClass' }
          ]
        }
      ],
      order: [['id', 'ASC']]
    });

    res.json({ code: 0, period, slips });
  } catch (e) {
    console.error('Error in GET /api/payroll/periods/:id/slips:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Single payslip detail
router.get('/slip/:id', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const id = parseInt(req.params.id, 10);

    const slip = await models.PayrollSlip.findOne({
      where: { id, tenantId },
      include: [
        { model: models.PayrollPeriod, as: 'period' },
        {
          model: models.TenantMember,
          as: 'member',
          include: [
            { model: models.User, as: 'user' },
            { model: models.MemberClass, as: 'memberClass' }
          ]
        }
      ]
    });

    if (!slip) {
      return res.status(404).json({ code: -1, message: 'Payslip not found.' });
    }

    res.json({ code: 0, slip });
  } catch (e) {
    console.error('Error in GET /api/payroll/slip/:id:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Approve period
router.post('/periods/:id/approve', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const periodId = parseInt(req.params.id, 10);

    const period = await models.PayrollPeriod.findOne({
      where: { id: periodId, tenantId }
    });

    if (!period) {
      return res.status(404).json({ code: -1, message: 'Payroll period not found.' });
    }

    period.status = 'approved';
    await period.save();

    await models.PayrollSlip.update(
      { status: 'approved' },
      { where: { tenantId, payrollPeriodId: periodId } }
    );

    res.json({ code: 0, message: 'Payroll approved.', period });
  } catch (e) {
    console.error('Error in POST /api/payroll/periods/:id/approve:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// ---------------------------------------------------------------------------
// Accounting Voucher Direct Generation (伝票起票)
// ---------------------------------------------------------------------------
router.post('/periods/:id/create-voucher', async (req, res) => {
  const transaction = await models.sequelize.transaction();
  try {
    const tenantId = req.currentTenantId;
    const userId = req.session.user.id;
    const periodId = parseInt(req.params.id, 10);

    const period = await models.PayrollPeriod.findOne({
      where: { id: periodId, tenantId },
      transaction
    });

    if (!period) {
      await transaction.rollback();
      return res.status(404).json({ code: -1, message: 'Payroll period not found.' });
    }

    if (period.crossSlipId) {
      await transaction.rollback();
      return res.status(400).json({ code: -1, message: 'Bút toán kế toán cho kỳ lương này đã được tạo trước đó.' });
    }

    // Find current fiscal year term
    const fiscalYear = await models.FiscalYear.findOne({
      where: { tenantId },
      order: [['term', 'DESC']],
      transaction
    });

    const term = fiscalYear ? fiscalYear.term : 1;
    const currentNo = (await models.CrossSlip.count({
      where: { tenantId, year: period.year, month: period.month },
      transaction
    })) + 1;

    // Create CrossSlip
    const crossSlip = await models.CrossSlip.create({
      tenantId,
      year: period.year,
      month: period.month,
      day: new Date(period.endDate).getDate(),
      no: currentNo,
      lineCount: 2,
      term,
      createdBy: userId,
      updatedBy: userId
    }, { transaction });

    // Debit: 641 (給料手当 / Salary Expense) = totalGrossPay
    // Credit 1: 334 (未払給与 / Accrued Salary Payable) = totalNetPay
    // Credit 2: 338 (預り金 / Withholdings - Insurances & Taxes) = totalDeductions
    const summary = `給与支給 ${period.year}年${period.month}月度 (Phân bổ lương & bảo hiểm)`;

    // Line 1: Net Pay liability
    await models.CrossSlipDetail.create({
      tenantId,
      crossSlipId: crossSlip.id,
      lineNo: 1,
      debitAccount: '641', // Salary Expense
      debitAmount: period.totalNetPay,
      creditAccount: '334', // Accrued Salary Payable
      creditAmount: period.totalNetPay,
      application1: `${summary} - Thực lĩnh`,
      application2: ''
    }, { transaction });

    // Line 2: Deductions / Withholding liability (if any)
    if (parseFloat(period.totalDeductions) > 0) {
      await models.CrossSlipDetail.create({
        tenantId,
        crossSlipId: crossSlip.id,
        lineNo: 2,
        debitAccount: '641', // Salary Expense
        debitAmount: period.totalDeductions,
        creditAccount: '338', // Withholdings (Insurances/Taxes)
        creditAmount: period.totalDeductions,
        application1: `${summary} - Trích nộp bảo hiểm & thuế`,
        application2: ''
      }, { transaction });
    }

    period.crossSlipId = crossSlip.id;
    await period.save({ transaction });

    await transaction.commit();

    res.json({
      code: 0,
      message: 'Bút toán hạch toán chi phí lương đã được tạo thành công vào Sổ Cái.',
      crossSlipId: crossSlip.id,
      crossSlip
    });
  } catch (e) {
    await transaction.rollback();
    console.error('Error in POST /api/payroll/periods/:id/create-voucher:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Export CSV
router.get('/periods/:id/export', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const periodId = parseInt(req.params.id, 10);

    const period = await models.PayrollPeriod.findOne({
      where: { id: periodId, tenantId }
    });

    if (!period) {
      return res.status(404).json({ code: -1, message: 'Payroll period not found.' });
    }

    const slips = await models.PayrollSlip.findAll({
      where: { tenantId, payrollPeriodId: periodId },
      include: [
        { model: models.TenantMember, as: 'member', include: [{ model: models.User, as: 'user', attributes: ['name', 'legalName'] }] }
      ]
    });

    const header = ['STT', 'Nhân viên', 'Ngày công', 'Giờ làm', 'Tăng ca (h)', 'Lương cơ bản', 'Tiền tăng ca', 'Phụ cấp', 'Tổng thu nhập (Gross)', 'Khấu trừ/Bảo hiểm', 'Thực lĩnh (Net)', 'Trạng thái'];

    const rows = slips.map((s, idx) => [
      idx + 1,
      s.member?.user?.legalName || s.member?.tradingName || `Member #${s.tenantMemberId}`,
      s.workingDays || 0,
      s.workHours || 0,
      s.overtimeHours || 0,
      s.basePay || 0,
      s.overtimePay || 0,
      s.allowancesTotal || 0,
      s.grossPay || 0,
      s.deductionsTotal || 0,
      s.netPay || 0,
      s.status || 'calculated'
    ]);

    const csvContent = [
      header.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="payroll-${period.year}-${period.month}-${Date.now()}.csv"`);
    res.send('\uFEFF' + csvContent);
  } catch (e) {
    console.error('Error in GET /api/payroll/periods/:id/export:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

export default router;
