/**
 * Tenant isolation — Issue #242 (E2.14).
 *
 * Cross-tenant attack vectors against /api/simulation/*. Tenant A creates a
 * scenario + entries; a user from Tenant B must NOT be able to read, mutate,
 * or report on it. Every cross-tenant request returns 404 (existence is not
 * leaked) — except permission failures which return 403.
 *
 * Uses real signup/login agents + the live test DB (no stubs), per §2.14.
 */

import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../../app.js';
import models from '../../models/index.js';

const RUN = Date.now().toString(36);
let SEQ = 0;

function makeUser(tag) {
  const name = `iso_${tag}_${RUN.slice(-3)}${(SEQ++).toString(36)}`.slice(0, 20);
  return { name, password: 'password-1234', legalName: `Iso ${tag}`, email: `${name}@example.com` };
}

async function signupAndLogin(tag) {
  const user = makeUser(tag);
  const agent = request.agent(app);
  const signupRes = await agent.post('/api/user/signup').send({
    user_name: user.name, password: user.password, legalName: user.legalName, email: user.email,
  });
  assert.ok(
    signupRes.body.result === 'OK' || (signupRes.body.message || '').includes('既に登録'),
    `signup: ${JSON.stringify(signupRes.body)}`
  );
  const loginRes = await agent.post('/api/user/login')
    .send({ user_name: user.name, password: user.password }).expect(200);
  assert.equal(loginRes.body.result, 'OK');
  const dbUser = await models.User.findOne({ where: { name: user.name } });
  return { agent, dbUser };
}

describe('Integration — simulation tenant isolation (Issue #242)', function () {
  this.timeout(60000);

  let agentA;
  let agentB;
  let scenarioId;
  let entryId;
  let tenantAId;

  before(async function () {
    ({ agent: agentA } = await signupAndLogin('A'));
    ({ agent: agentB } = await signupAndLogin('B'));

    // Tenant A creates a scenario.
    const createRes = await agentA.post('/api/simulation/scenarios').send({
      name: 'isolation scenario A',
      baseTerm: 1,
      basePeriodFrom: '2026-01-01', basePeriodTo: '2026-06-30',
      simPeriodFrom: '2026-07-01', simPeriodTo: '2026-09-30',
      visibility: 'shared', // even shared must not cross tenants
    });
    assert.equal(createRes.status, 201, `create: ${JSON.stringify(createRes.body)}`);
    scenarioId = createRes.body.scenario.id;
    tenantAId = createRes.body.scenario.tenantId;
  });

  after(async function () {
    if (scenarioId) {
      await models.SimulationEntry.destroy({ where: { scenarioId } });
      await models.SimulationScenario.destroy({ where: { id: scenarioId } });
    }
  });

  it('1) Tenant B list does not include Tenant A scenario', async function () {
    const res = await agentB.get('/api/simulation/scenarios').expect(200);
    const ids = (res.body.scenarios || []).map((s) => s.id);
    assert.equal(ids.includes(scenarioId), false, 'tenant B must not see A scenario');
  });

  it('2) GET A scenario from B → 404', async function () {
    await agentB.get(`/api/simulation/scenarios/${scenarioId}`).expect(404);
  });

  it('3) PATCH A scenario from B → 404', async function () {
    await agentB.patch(`/api/simulation/scenarios/${scenarioId}`).send({ name: 'hacked' }).expect(404);
  });

  it('4) POST entry to A scenario from B → 404', async function () {
    await agentB.post(`/api/simulation/scenarios/${scenarioId}/entries`).send({
      date: '2026-08-01', debitAccount: '10200000', debitAmount: 1,
      creditAccount: '20200000', creditAmount: 1,
    }).expect(404);
  });

  it('5) GET entries of A from B → 404', async function () {
    await agentB.get(`/api/simulation/scenarios/${scenarioId}/entries`).expect(404);
  });

  it('6) lock A from B → 404', async function () {
    await agentB.post(`/api/simulation/scenarios/${scenarioId}/lock`).send({}).expect(404);
  });

  it('7) trial-balance of A from B → 404', async function () {
    await agentB.get(`/api/simulation/scenarios/${scenarioId}/trial-balance`).expect(404);
  });

  it('8) comparison of A from B → 404', async function () {
    await agentB.get(`/api/simulation/scenarios/${scenarioId}/comparison`).expect(404);
  });

  it('9) export of A from B → 404', async function () {
    await agentB.get(`/api/simulation/scenarios/${scenarioId}/export?type=trial-balance`).expect(404);
  });

  it('10) owner (A) can still access its own scenario', async function () {
    await agentA.get(`/api/simulation/scenarios/${scenarioId}`).expect(200);
  });
});
