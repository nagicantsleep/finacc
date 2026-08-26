import assert from 'assert';
import supertest from 'supertest';
import app from '../app.js';
import models from '../models/index.js';

describe('Attendance & Payroll System with Accounting Integration (Epic 2 / Issue #348)', function () {
  this.timeout(15000);

  let agentA, agentB;
  let userA, userB;
  let tenantA, tenantB;
  let memberA;
  let periodId;

  async function createAuthenticatedAgent(prefix) {
    const agent = supertest.agent(app);
    const uname = `${prefix}_${Math.random().toString(36).slice(2, 6)}`;
    const email = `${uname}@example.com`;
    const password = 'password123';

    const signupRes = await agent
      .post('/api/user/signup')
      .send({
        user_name: uname,
        password,
        legalName: `HR User ${uname}`,
        email
      });
    assert.strictEqual(signupRes.status, 200, `Signup failed: ${JSON.stringify(signupRes.body)}`);

    const loginRes = await agent
      .post('/api/user/login')
      .send({
        user_name: uname,
        password
      });
    assert.strictEqual(loginRes.status, 200, `Login failed: ${JSON.stringify(loginRes.body)}`);

    const user = await models.User.findOne({ where: { name: uname } });
    const tenantMember = await models.TenantMember.findOne({ where: { userId: user.id } });
    const tenant = await models.Tenant.findByPk(tenantMember.tenantId);

    // Grant all manager permissions
    tenantMember.accounting = true;
    tenantMember.personnelManagement = true;
    tenantMember.administrable = true;
    tenantMember.companyManagement = true;
    await tenantMember.save();

    return { agent, user, tenant, member: tenantMember };
  }

  before(async function () {
    const resA = await createAuthenticatedAgent('hr_a');
    agentA = resA.agent;
    userA = resA.user;
    tenantA = resA.tenant;
    memberA = resA.member;

    const resB = await createAuthenticatedAgent('hr_b');
    agentB = resB.agent;
    userB = resB.user;
    tenantB = resB.tenant;
  });

  describe('1. Attendance & Shift Tracking', function () {
    const today = '2026-08-15';

    it('clocks in for the current user', async function () {
      const clockInTime = `${today}T08:30:00.000Z`;
      const res = await agentA
        .post('/api/attendance/clock-in')
        .send({ date: today, time: clockInTime, status: 'present', note: 'Morning arrival' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.code, 0);
      assert.ok(res.body.record);
      assert.strictEqual(res.body.record.tenantId, tenantA.id);
      assert.strictEqual(res.body.record.userId, userA.id);
    });

    it('rejects duplicate clock-in on same day', async function () {
      const res = await agentA
        .post('/api/attendance/clock-in')
        .send({ date: today, time: `${today}T08:45:00.000Z` });

      assert.strictEqual(res.status, 400);
    });

    it('clocks out and computes workHours and overtimeHours', async function () {
      // 08:30 to 19:30 with 60 min break = 10 hours total (8 normal + 2 overtime)
      const clockOutTime = `${today}T19:30:00.000Z`;
      const res = await agentA
        .post('/api/attendance/clock-out')
        .send({ date: today, time: clockOutTime, note: 'Evening departure' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.code, 0);
      assert.ok(Number(res.body.record.workHours) >= 9.0);
      assert.ok(Number(res.body.record.overtimeHours) >= 1.0);
    });

    it('fetches monthly attendance sheet and summary', async function () {
      const res = await agentA
        .get('/api/attendance/monthly?year=2026&month=8');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.code, 0);
      assert.ok(res.body.records.length >= 1);
      assert.ok(res.body.summary.workingDays >= 1);
      assert.ok(res.body.summary.totalWorkHours > 0);
    });
  });

  describe('2. Leave Request & Manager Approval Workflow', function () {
    let leaveId;

    it('submits a leave request', async function () {
      const res = await agentA
        .post('/api/attendance/leaves')
        .send({
          leaveType: 'paid_annual',
          startDate: '2026-08-20',
          endDate: '2026-08-21',
          days: 2.0,
          reason: 'Personal vacation'
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.code, 0);
      assert.strictEqual(res.body.leave.status, 'pending');
      leaveId = res.body.leave.id;
    });

    it('lists leave requests', async function () {
      const res = await agentA
        .get('/api/attendance/leaves');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.code, 0);
      assert.ok(res.body.leaves.length >= 1);
    });

    it('manager reviews and approves leave request', async function () {
      const res = await agentA
        .put(`/api/attendance/leaves/${leaveId}/review`)
        .send({
          status: 'approved',
          reviewComment: 'Approved by HR Manager'
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.code, 0);
      assert.strictEqual(res.body.leave.status, 'approved');

      // Verify attendance record created for leave date
      const att = await models.AttendanceRecord.findOne({
        where: { tenantId: tenantA.id, userId: userA.id, date: '2026-08-20' }
      });
      assert.ok(att);
      assert.strictEqual(att.status, 'leave');
    });
  });

  describe('3. Salary Structure & Automated Payroll Calculation', function () {
    it('creates a salary formula for member', async function () {
      const res = await agentA
        .post('/api/payroll/formulas')
        .send({
          tenantMemberId: memberA.id,
          baseSalary: 10000000,
          hourlyRate: 62500,
          overtimeMultiplier: 1.25,
          allowances: [
            { key: 'commute', name: 'Phụ cấp đi lại', amount: 500000 },
            { key: 'lunch', name: 'Phụ cấp ăn trưa', amount: 800000 }
          ],
          deductions: [
            { key: 'health_ins', name: 'BHYT', rate: 0.015 },
            { key: 'social_ins', name: 'BHXH', rate: 0.08 }
          ]
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.code, 0);
      assert.strictEqual(Number(res.body.formula.baseSalary), 10000000);
    });

    it('creates a new payroll period', async function () {
      const res = await agentA
        .post('/api/payroll/periods')
        .send({
          year: 2026,
          month: 8,
          paymentDate: '2026-09-05'
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.code, 0);
      assert.strictEqual(res.body.period.year, 2026);
      assert.strictEqual(res.body.period.month, 8);
      periodId = res.body.period.id;
    });

    it('runs batch payroll calculation for period', async function () {
      const res = await agentA
        .post(`/api/payroll/periods/${periodId}/calculate`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.code, 0);
      assert.strictEqual(res.body.period.status, 'calculated');
      assert.ok(Number(res.body.period.totalGrossPay) > 10000000);
      assert.ok(Number(res.body.period.totalNetPay) > 0);
      assert.ok(res.body.slips.length >= 1);
    });

    it('approves the calculated payroll period', async function () {
      const res = await agentA
        .post(`/api/payroll/periods/${periodId}/approve`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.code, 0);
      assert.strictEqual(res.body.period.status, 'approved');
    });
  });

  describe('4. Direct Accounting Integration (伝票起票)', function () {
    it('creates General Ledger CrossSlip voucher for approved payroll', async function () {
      const res = await agentA
        .post(`/api/payroll/periods/${periodId}/create-voucher`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.code, 0);
      assert.ok(res.body.crossSlipId);

      // Verify CrossSlip in DB
      const slip = await models.CrossSlip.findOne({
        where: { id: res.body.crossSlipId, tenantId: tenantA.id },
        include: [{ model: models.CrossSlipDetail, as: 'lines' }]
      });

      assert.ok(slip);
      assert.strictEqual(slip.lines.length, 2);
      assert.strictEqual(slip.lines[0].debitAccount, '641');
      assert.strictEqual(slip.lines[0].creditAccount, '334');
      assert.strictEqual(slip.lines[1].creditAccount, '338');
    });

    it('exports payroll summary to CSV', async function () {
      const res = await agentA
        .get(`/api/payroll/periods/${periodId}/export`);

      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes('Nhân viên'));
      assert.ok(res.text.includes('Tổng thu nhập (Gross)'));
    });
  });

  describe('5. Multi-Tenant Isolation', function () {
    it('prevents Tenant B from viewing Tenant A attendance, leaves, formulas, or payroll', async function () {
      // Leaves of Tenant A
      const leavesRes = await agentB.get('/api/attendance/leaves?allMembers=true');
      assert.strictEqual(leavesRes.status, 200);
      assert.strictEqual(leavesRes.body.leaves.length, 0);

      // Formulas of Tenant A
      const formulasRes = await agentB.get('/api/payroll/formulas');
      assert.strictEqual(formulasRes.status, 200);
      assert.strictEqual(formulasRes.body.formulas.length, 0);

      // Slips of Tenant A's period
      const slipsRes = await agentB.get(`/api/payroll/periods/${periodId}/slips`);
      assert.strictEqual(slipsRes.status, 404);

      // Create voucher on Tenant A's period
      const vRes = await agentB.post(`/api/payroll/periods/${periodId}/create-voucher`);
      assert.strictEqual(vRes.status, 404);
    });
  });
});
