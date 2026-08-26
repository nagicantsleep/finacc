import assert from 'assert';
import request from 'supertest';
import app from '../app.js';
import models from '../models/index.js';

describe('Expense Reimbursement & Advances Integration Tests (Epic 3)', function () {
  this.timeout(10000);

  let agentA;
  let agentB;
  let userA;
  let userB;
  let tenantA;
  let tenantB;
  let categoryA;
  let advanceA;
  let claimA;

  async function createTestUser(prefix) {
    const agent = request.agent(app);
    const uname = `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const password = 'password123';
    const email = `${uname}@example.com`;

    const signupRes = await agent
      .post('/api/user/signup')
      .send({
        user_name: uname,
        password,
        legalName: `User ${uname}`,
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

    tenantMember.accounting = true;
    tenantMember.personnelManagement = true;
    tenantMember.administrable = true;
    tenantMember.companyManagement = true;
    await tenantMember.save();

    await models.FiscalYear.findOrCreate({
      where: { tenantId: tenant.id, term: 1 },
      defaults: {
        term: 1,
        year: 2026,
        startDate: '2026-01-01',
        endDate: '2026-12-31'
      }
    });

    return { agent, user, tenant, member: tenantMember };
  }

  before(async function () {
    const userAObj = await createTestUser('exp_a');
    agentA = userAObj.agent;
    userA = userAObj.user;
    tenantA = userAObj.tenant;

    const userBObj = await createTestUser('exp_b');
    agentB = userBObj.agent;
    userB = userBObj.user;
    tenantB = userBObj.tenant;
  });

  it('1. Create and list expense categories', async function () {
    const res = await agentA
      .post('/api/expense/categories')
      .send({
        name: 'Công tác & Đi lại',
        code: 'travel',
        accountCode: '642',
        icon: 'bi-airplane',
        description: 'Chi phí vé máy bay, taxi, đi lại công tác'
      })
      .expect(200);

    assert.strictEqual(res.body.code, 0);
    assert.strictEqual(res.body.category.code, 'travel');
    categoryA = res.body.category;

    const listRes = await agentA.get('/api/expense/categories').expect(200);
    assert.strictEqual(listRes.body.code, 0);
    assert(listRes.body.categories.some(c => c.code === 'travel'));
  });

  it('2. Submit an expense advance request (Tạm ứng)', async function () {
    const res = await agentA
      .post('/api/expense/advances')
      .send({
        title: 'Tạm ứng công tác Hà Nội - Đà Nẵng',
        amount: 5000000,
        requestDate: '2026-08-25',
        expectedDate: '2026-08-28',
        purpose: 'Vé máy bay và khách sạn khảo sát thị trường'
      })
      .expect(200);

    assert.strictEqual(res.body.code, 0);
    assert.strictEqual(res.body.advance.status, 'pending');
    assert.strictEqual(Number(res.body.advance.amount), 5000000);
    advanceA = res.body.advance;
  });

  it('3. Review and disburse expense advance', async function () {
    const res = await agentA
      .put(`/api/expense/advances/${advanceA.id}/review`)
      .send({
        status: 'disbursed',
        reviewComment: 'Đã chuyển khoản tạm ứng tiền mặt qua ngân hàng'
      })
      .expect(200);

    assert.strictEqual(res.body.code, 0);
    assert.strictEqual(res.body.advance.status, 'disbursed');
  });

  it('4. Create an expense claim linking advance with multiple items', async function () {
    const res = await agentA
      .post('/api/expense/claims')
      .send({
        title: 'Quyết toán công tác Đà Nẵng Q3/2026',
        claimDate: '2026-08-28',
        expenseAdvanceId: advanceA.id,
        items: [
          {
            expenseCategoryId: categoryA.id,
            date: '2026-08-26',
            amount: 3200000,
            taxAmount: 256000,
            description: 'Vé máy bay khứ hồi VNA HAN-DAD'
          },
          {
            expenseCategoryId: categoryA.id,
            date: '2026-08-27',
            amount: 2800000,
            taxAmount: 224000,
            description: 'Khách sạn Novotel 2 đêm'
          },
          {
            expenseCategoryId: categoryA.id,
            date: '2026-08-28',
            amount: 1500000,
            taxAmount: 0,
            description: 'Ăn trưa & tiếp khách đối tác'
          }
        ]
      })
      .expect(200);

    assert.strictEqual(res.body.code, 0);
    assert.strictEqual(res.body.claim.items.length, 3);
    assert.strictEqual(Number(res.body.claim.totalAmount), 7500000);
    assert.strictEqual(Number(res.body.claim.advanceAmount), 5000000);
    // Net reimbursement = 7,500,000 - 5,000,000 = 2,500,000
    assert.strictEqual(Number(res.body.claim.netAmount), 2500000);
    assert.strictEqual(res.body.claim.status, 'submitted');
    claimA = res.body.claim;
  });

  it('5. Get single claim detail', async function () {
    const res = await agentA.get(`/api/expense/claim/${claimA.id}`).expect(200);
    assert.strictEqual(res.body.code, 0);
    assert.strictEqual(res.body.claim.id, claimA.id);
    assert.strictEqual(res.body.claim.items.length, 3);
    assert.strictEqual(res.body.claim.advance.id, advanceA.id);
  });

  it('6. Approve expense claim', async function () {
    const res = await agentA
      .put(`/api/expense/claim/${claimA.id}/review`)
      .send({
        status: 'approved',
        reviewComment: 'Hồ sơ đầy đủ hóa đơn hợp lệ'
      })
      .expect(200);

    assert.strictEqual(res.body.code, 0);
    assert.strictEqual(res.body.claim.status, 'approved');
  });

  it('7. Generate General Ledger Accounting Voucher (伝票起票)', async function () {
    const res = await agentA
      .post(`/api/expense/claim/${claimA.id}/create-voucher`)
      .expect(200);

    assert.strictEqual(res.body.code, 0);
    assert(res.body.crossSlipId > 0);

    // Verify CrossSlip details in DB
    const details = await models.CrossSlipDetail.findAll({
      where: { crossSlipId: res.body.crossSlipId }
    });

    assert(details.length > 0);
    // Total debit must equal total credit
    let totalDebit = 0;
    let totalCredit = 0;
    for (const d of details) {
      totalDebit += parseFloat(d.debitAmount);
      totalCredit += parseFloat(d.creditAmount);
    }
    assert.strictEqual(totalDebit, totalCredit);
    assert.strictEqual(totalDebit, 7500000);

    // Verify claim status is updated to settled
    const updatedClaim = await models.ExpenseClaim.findByPk(claimA.id);
    assert.strictEqual(updatedClaim.status, 'settled');
    assert.strictEqual(updatedClaim.crossSlipId, res.body.crossSlipId);

    // Verify linked advance is settled
    const updatedAdvance = await models.ExpenseAdvance.findByPk(advanceA.id);
    assert.strictEqual(updatedAdvance.status, 'settled');
  });

  it('8. Multi-tenant isolation: Tenant B cannot access Tenant A expense claims or categories', async function () {
    // Tenant B cannot view Tenant A claim
    await agentB.get(`/api/expense/claim/${claimA.id}`).expect(404);

    // Tenant B claims list is empty
    const res = await agentB.get('/api/expense/claims').expect(200);
    assert.strictEqual(res.body.code, 0);
    assert.strictEqual(res.body.claims.length, 0);

    // Tenant B cannot review Tenant A claim
    await agentB.put(`/api/expense/claim/${claimA.id}/review`).send({ status: 'rejected' }).expect(404);
  });

  it('9. Export CSV report', async function () {
    const res = await agentA.get(`/api/expense/claim/${claimA.id}/export`).expect(200);
    assert(res.text.includes('Vé máy bay khứ hồi'));
    assert(res.text.includes('7500000'));
    assert(res.text.includes('2500000'));
  });
});
