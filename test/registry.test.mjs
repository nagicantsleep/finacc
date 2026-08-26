import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../app.js';
import models from '../models/index.js';

const RUN = Date.now().toString(36).slice(-4);
const USER_A = { name: `reg_a_${RUN}`, password: 'password-a' };
const USER_B = { name: `reg_b_${RUN}`, password: 'password-b' };

async function signupAndLogin(user) {
  const agent = request.agent(app);

  const signupRes = await agent
    .post('/api/user/signup')
    .send({
      user_name: user.name,
      password: user.password,
      legalName: `Registry ${user.name}`,
      email: `${user.name}@example.com`
    })
    .expect('Content-Type', /json/);

  assert.ok(
    signupRes.body.result === 'OK' || signupRes.body.message?.includes('既に登録'),
    `signup unexpected result: ${JSON.stringify(signupRes.body)}`
  );

  const loginRes = await agent
    .post('/api/user/login')
    .send({ user_name: user.name, password: user.password })
    .expect('Content-Type', /json/)
    .expect(200);

  assert.equal(loginRes.body.result, 'OK', `login failed for ${user.name}`);
  return agent;
}

describe('Custom Registry & Dynamic Ledger System (Epic 1 / Issue #346)', function () {
  this.timeout(30000);

  let agentA, agentB;
  let defAId, entryAId;

  before(async function () {
    agentA = await signupAndLogin(USER_A);
    agentB = await signupAndLogin(USER_B);
  });

  describe('1. Registry Definitions CRUD & Schema validation', function () {
    it('creates a custom registry definition with schema fields', async function () {
      const res = await agentA
        .post('/api/registry/definitions')
        .send({
          name: 'Sổ Chăm Sóc Khách Hàng VIP',
          code: 'vip_crm_log',
          description: 'Theo dõi lịch sử tiếp xúc và hợp đồng khách hàng VIP',
          icon: 'bi-gem',
          schema: {
            fields: [
              { key: 'contactPerson', label: 'Người liên hệ', type: 'text', required: true },
              { key: 'dealValue', label: 'Giá trị hợp đồng (JPY)', type: 'number', required: true },
              { key: 'priority', label: 'Mức độ ưu tiên', type: 'select', options: ['High', 'Medium', 'Low'] },
              { key: 'isVip', label: 'Khách hàng VIP', type: 'checkbox' },
              { key: 'lastContactDate', label: 'Ngày liên hệ gần nhất', type: 'date' }
            ]
          }
        })
        .expect(200);

      assert.equal(res.body.code, 0);
      assert.ok(res.body.definition.id > 0);
      assert.equal(res.body.definition.code, 'vip_crm_log');
      assert.equal(res.body.definition.schema.fields.length, 5);
      defAId = res.body.definition.id;
    });

    it('rejects duplicate registry code in same tenant', async function () {
      const res = await agentA
        .post('/api/registry/definitions')
        .send({
          name: 'Trùng mã',
          code: 'vip_crm_log'
        })
        .expect(409);

      assert.equal(res.body.code, -1);
    });

    it('lists active registry definitions with entryCount', async function () {
      const res = await agentA
        .get('/api/registry/definitions')
        .expect(200);

      assert.equal(res.body.code, 0);
      assert.ok(res.body.definitions.some(d => d.id === defAId));
    });

    it('updates definition metadata and schema', async function () {
      const res = await agentA
        .put(`/api/registry/definitions/${defAId}`)
        .send({
          name: 'Sổ Chăm Sóc KH VIP (Updated)',
          displayOrder: 1
        })
        .expect(200);

      assert.equal(res.body.code, 0);
      assert.equal(res.body.definition.name, 'Sổ Chăm Sóc KH VIP (Updated)');
      assert.equal(res.body.definition.displayOrder, 1);
    });
  });

  describe('2. Registry Entries CRUD & Field validation', function () {
    it('fails when required schema fields are missing', async function () {
      const res = await agentA
        .post(`/api/registry/entries/${defAId}`)
        .send({
          title: 'Khách hàng VinFast Nhật Bản',
          data: {
            priority: 'High'
          }
        })
        .expect(400);

      assert.equal(res.body.code, -1);
      assert.ok(res.body.message.includes('required'));
    });

    it('fails when number field is not a number', async function () {
      const res = await agentA
        .post(`/api/registry/entries/${defAId}`)
        .send({
          title: 'Khách hàng VinFast',
          data: {
            contactPerson: 'Nguyễn Văn A',
            dealValue: 'chưa xác định'
          }
        })
        .expect(400);

      assert.equal(res.body.code, -1);
      assert.ok(res.body.message.includes('number'));
    });

    it('successfully creates an entry with valid schema data', async function () {
      const res = await agentA
        .post(`/api/registry/entries/${defAId}`)
        .send({
          title: 'Công ty TNHH Giải Pháp Phần Mềm ABC',
          status: 'in_progress',
          data: {
            contactPerson: 'Tanaka Kenji',
            dealValue: 5000000,
            priority: 'High',
            isVip: true,
            lastContactDate: '2026-08-25'
          }
        })
        .expect(200);

      assert.equal(res.body.code, 0);
      assert.ok(res.body.entry.id > 0);
      assert.equal(res.body.entry.data.dealValue, 5000000);
      assert.ok(res.body.entry.code.startsWith('VIP_CRM_LOG-'));
      entryAId = res.body.entry.id;
    });

    it('gets single entry with populated creator and initial timeline', async function () {
      const res = await agentA
        .get(`/api/registry/entry/${entryAId}`)
        .expect(200);

      assert.equal(res.body.code, 0);
      assert.equal(res.body.entry.title, 'Công ty TNHH Giải Pháp Phần Mềm ABC');
      assert.ok(res.body.entry.timelines.length >= 1);
      assert.equal(res.body.entry.timelines[0].action, 'create');
    });

    it('updates entry and records timeline diff', async function () {
      const res = await agentA
        .put(`/api/registry/entry/${entryAId}`)
        .send({
          title: 'Công ty TNHH Giải Pháp Phần Mềm ABC (Gia hạn)',
          status: 'closed_won',
          comment: 'Đã ký hợp đồng chính thức 5M JPY',
          data: {
            contactPerson: 'Tanaka Kenji',
            dealValue: 6000000,
            priority: 'High',
            isVip: true,
            lastContactDate: '2026-08-26'
          }
        })
        .expect(200);

      assert.equal(res.body.code, 0);
      assert.equal(res.body.entry.status, 'closed_won');
      assert.equal(res.body.entry.data.dealValue, 6000000);

      const detailRes = await agentA
        .get(`/api/registry/entry/${entryAId}`)
        .expect(200);

      assert.ok(detailRes.body.entry.timelines.some(t => t.action === 'comment' && t.comment.includes('Đã ký hợp đồng')));
    });

    it('adds interactive CRM activity note to timeline', async function () {
      const res = await agentA
        .post(`/api/registry/entry/${entryAId}/timeline`)
        .send({
          action: 'contact_log',
          comment: 'Gọi điện trao đổi qua Zoom với CEO Tanaka lúc 15:00. Khách hàng hài lòng.'
        })
        .expect(200);

      assert.equal(res.body.code, 0);
      assert.equal(res.body.timeline.action, 'contact_log');
      assert.ok(res.body.timeline.comment.includes('CEO Tanaka'));
    });

    it('searches and filters entries', async function () {
      const res = await agentA
        .get(`/api/registry/entries/${defAId}?q=ABC&status=closed_won`)
        .expect(200);

      assert.equal(res.body.code, 0);
      assert.equal(res.body.total, 1);
      assert.equal(res.body.entries[0].id, entryAId);
    });

    it('exports registry entries to CSV format', async function () {
      const res = await agentA
        .get(`/api/registry/entries/${defAId}/export`)
        .expect(200);

      assert.ok(res.headers['content-type'].includes('text/csv'));
      assert.ok(res.text.includes('Tanaka Kenji'));
      assert.ok(res.text.includes('6000000'));
    });
  });

  describe('3. Multi-Tenant Isolation', function () {
    it('prevents Tenant B from seeing Tenant A registry definitions or entries', async function () {
      const listRes = await agentB
        .get('/api/registry/definitions')
        .expect(200);

      assert.equal(listRes.body.code, 0);
      assert.ok(!listRes.body.definitions.some(d => d.id === defAId));

      await agentB
        .get(`/api/registry/entry/${entryAId}`)
        .expect(404);

      await agentB
        .post(`/api/registry/entry/${entryAId}/timeline`)
        .send({ comment: 'Illegal comment from Tenant B' })
        .expect(404);
    });
  });
});
