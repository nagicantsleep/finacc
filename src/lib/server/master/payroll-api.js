import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

const Op = models.Sequelize.Op;

function fail(e, status = 500) {
  console.error(e);
  return json({ code: -1, message: e.message }, { status });
}

export async function handlePayroll(method, { locals, url, body }) {
  const tenantId = locals.tenantId;
  const userId = locals.user?.id;
  const parts = url.pathname.replace(/^\/api\/payroll\/?/, '').split('/').filter(Boolean);

  try {
    if (parts[0] === 'formulas' && !parts[1]) {
      if (method === 'GET') {
        const formulas = await models.SalaryFormula.findAll({
          where: { tenantId },
          include: [
            { model: models.TenantMember, as: 'member', include: [{ model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] }] },
            { model: models.MemberClass, as: 'memberClass' }
          ]
        });
        return json({ code: 0, formulas });
      }
      if (method === 'POST') {
        const { tenantMemberId, memberClassId, baseSalary, hourlyRate, overtimeMultiplier, allowances, deductions } = body;
        if (!tenantMemberId && !memberClassId) {
          return json({ code: -1, message: 'tenantMemberId or memberClassId is required.' }, { status: 400 });
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
        if (!formula) formula = await models.SalaryFormula.create(payload);
        else await formula.update(payload);
        return json({ code: 0, formula });
      }
    }

    if (parts[0] === 'periods' && !parts[1]) {
      if (method === 'GET') {
        const periods = await models.PayrollPeriod.findAll({
          where: { tenantId },
          order: [['year', 'DESC'], ['month', 'DESC']],
          include: [
            { model: models.CrossSlip, as: 'crossSlip', attributes: ['id', 'no', 'year', 'month'] },
            { model: models.PayrollSlip, as: 'slips', attributes: ['id'] }
          ]
        });
        const results = periods.map((p) => {
          const plain = p.toJSON();
          plain.slipCount = plain.slips ? plain.slips.length : 0;
          delete plain.slips;
          return plain;
        });
        return json({ code: 0, periods: results });
      }
      if (method === 'POST') {
        const { year, month, startDate, endDate, paymentDate } = body;
        if (!year || !month) {
          return json({ code: -1, message: 'Year and Month are required.' }, { status: 400 });
        }
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        const lastDay = new Date(y, m, 0).getDate();
        const start = startDate || `${y}-${String(m).padStart(2, '0')}-01`;
        const end = endDate || `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const existing = await models.PayrollPeriod.findOne({ where: { tenantId, year: y, month: m } });
        if (existing) {
          return json({ code: -1, message: `Kỳ lương ${y}年${m}月 đã tồn tại.` }, { status: 409 });
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
        return json({ code: 0, period });
      }
    }

    if (parts[0] === 'periods' && parts[1] && parts[2] === 'calculate' && method === 'POST') {
      return calculatePeriod(tenantId, parseInt(parts[1], 10));
    }

    if (parts[0] === 'periods' && parts[1] && parts[2] === 'slips' && method === 'GET') {
      const periodId = parseInt(parts[1], 10);
      const period = await models.PayrollPeriod.findOne({
        where: { id: periodId, tenantId },
        include: [{ model: models.CrossSlip, as: 'crossSlip' }]
      });
      if (!period) return json({ code: -1, message: 'Payroll period not found.' }, { status: 404 });
      const slips = await models.PayrollSlip.findAll({
        where: { tenantId, payrollPeriodId: periodId },
        include: [{
          model: models.TenantMember,
          as: 'member',
          include: [
            { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] },
            { model: models.MemberClass, as: 'memberClass' }
          ]
        }],
        order: [['id', 'ASC']]
      });
      return json({ code: 0, period, slips });
    }

    if (parts[0] === 'periods' && parts[1] && parts[2] === 'approve' && method === 'POST') {
      const periodId = parseInt(parts[1], 10);
      const period = await models.PayrollPeriod.findOne({ where: { id: periodId, tenantId } });
      if (!period) return json({ code: -1, message: 'Payroll period not found.' }, { status: 404 });
      period.status = 'approved';
      await period.save();
      await models.PayrollSlip.update({ status: 'approved' }, { where: { tenantId, payrollPeriodId: periodId } });
      return json({ code: 0, message: 'Payroll approved.', period });
    }

    if (parts[0] === 'periods' && parts[1] && parts[2] === 'create-voucher' && method === 'POST') {
      return createVoucher(tenantId, userId, parseInt(parts[1], 10));
    }

    if (parts[0] === 'periods' && parts[1] && parts[2] === 'export' && method === 'GET') {
      const periodId = parseInt(parts[1], 10);
      const period = await models.PayrollPeriod.findOne({ where: { id: periodId, tenantId } });
      if (!period) return json({ code: -1, message: 'Payroll period not found.' }, { status: 404 });
      const slips = await models.PayrollSlip.findAll({
        where: { tenantId, payrollPeriodId: periodId },
        include: [{
          model: models.TenantMember,
          as: 'member',
          include: [{ model: models.User, as: 'user', attributes: ['name', 'legalName'] }]
        }]
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
        header.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','),
        ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');
      return new Response('\uFEFF' + csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="payroll-${period.year}-${period.month}-${Date.now()}.csv"`
        }
      });
    }

    if (parts[0] === 'slip' && parts[1] && method === 'GET') {
      const id = parseInt(parts[1], 10);
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
      if (!slip) return json({ code: -1, message: 'Payslip not found.' }, { status: 404 });
      return json({ code: 0, slip });
    }

    return json({ code: -1, message: 'Not found' }, { status: 404 });
  } catch (e) {
    return fail(e);
  }
}

async function calculatePeriod(tenantId, periodId) {
  const transaction = await models.sequelize.transaction();
  try {
    const period = await models.PayrollPeriod.findOne({ where: { id: periodId, tenantId }, transaction });
    if (!period) {
      await transaction.rollback();
      return json({ code: -1, message: 'Payroll period not found.' }, { status: 404 });
    }
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
      const attendanceWhere = {
        tenantId,
        date: { [Op.between]: [period.startDate, period.endDate] }
      };
      if (member.userId) attendanceWhere.userId = member.userId;
      else attendanceWhere.tenantMemberId = member.id;
      const attendances = await models.AttendanceRecord.findAll({ where: attendanceWhere, transaction });
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
        if (a.status === 'leave') leaveDays += 1;
      }
      if (workingDays === 0 && attendances.length === 0) {
        workingDays = 20;
        workHours = 160.0;
      }
      const overtimePay = Math.round(overtimeHours * hourlyRate * overtimeMultiplier);
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
        const healthIns = Math.round(grossPay * 0.05);
        const pension = Math.round(grossPay * 0.08);
        deductionsTotal = healthIns + pension;
        deductionsDetail.health_insurance = healthIns;
        deductionsDetail.pension_insurance = pension;
      }
      const netPay = Math.max(0, grossPay - deductionsTotal);
      totalGross += grossPay;
      totalDeductions += deductionsTotal;
      totalNet += netPay;
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
      if (existingSlip) await existingSlip.update(slipData, { transaction });
      else await models.PayrollSlip.create(slipData, { transaction });
    }
    period.totalGrossPay = totalGross;
    period.totalDeductions = totalDeductions;
    period.totalNetPay = totalNet;
    period.status = 'calculated';
    await period.save({ transaction });
    await transaction.commit();
    const slips = await models.PayrollSlip.findAll({
      where: { tenantId, payrollPeriodId: period.id },
      include: [{
        model: models.TenantMember,
        as: 'member',
        include: [{ model: models.User, as: 'user', attributes: ['name', 'legalName'] }]
      }]
    });
    return json({ code: 0, period, slips });
  } catch (e) {
    await transaction.rollback();
    return fail(e);
  }
}

async function createVoucher(tenantId, userId, periodId) {
  const transaction = await models.sequelize.transaction();
  try {
    const period = await models.PayrollPeriod.findOne({ where: { id: periodId, tenantId }, transaction });
    if (!period) {
      await transaction.rollback();
      return json({ code: -1, message: 'Payroll period not found.' }, { status: 404 });
    }
    if (period.crossSlipId) {
      await transaction.rollback();
      return json({ code: -1, message: 'Bút toán kế toán cho kỳ lương này đã được tạo trước đó.' }, { status: 400 });
    }
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
    const summary = `給与支給 ${period.year}年${period.month}月度 (Phân bổ lương & bảo hiểm)`;
    await models.CrossSlipDetail.create({
      tenantId,
      crossSlipId: crossSlip.id,
      lineNo: 1,
      debitAccount: '641',
      debitAmount: period.totalNetPay,
      creditAccount: '334',
      creditAmount: period.totalNetPay,
      application1: `${summary} - Thực lĩnh`,
      application2: ''
    }, { transaction });
    if (parseFloat(period.totalDeductions) > 0) {
      await models.CrossSlipDetail.create({
        tenantId,
        crossSlipId: crossSlip.id,
        lineNo: 2,
        debitAccount: '641',
        debitAmount: period.totalDeductions,
        creditAccount: '338',
        creditAmount: period.totalDeductions,
        application1: `${summary} - Trích nộp bảo hiểm & thuế`,
        application2: ''
      }, { transaction });
    }
    period.crossSlipId = crossSlip.id;
    await period.save({ transaction });
    await transaction.commit();
    return json({
      code: 0,
      message: 'Bút toán hạch toán chi phí lương đã được tạo thành công vào Sổ Cái.',
      crossSlipId: crossSlip.id,
      crossSlip
    });
  } catch (e) {
    await transaction.rollback();
    return fail(e);
  }
}
