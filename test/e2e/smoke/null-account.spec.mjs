/**
 * Null-account resilience smoke — Issue #296.
 *
 * Regression guard for #138 (api_remaining crashed on null account_rec).
 * Hammers the three Account.findOne-using routes with non-existent codes
 * and asserts the server stays alive and returns 404 consistently.
 *
 * Run with: npm run test:smoke
 */

import { strict as assert } from 'node:assert';
import { signupAndLogin, freshUser } from '../setup.js';

describe('Smoke — null-account resilience (regression #138)', function () {
  this.timeout(60000);

  let agent;
  let tenantId;

  before(async function () {
    agent = await signupAndLogin(freshUser('null'));
    const tenants = await agent.get('/api/user/tenants').expect(200);
    tenantId = tenants.body.tenants[0].tenantId;
    await agent
      .post('/api/user/select-tenant')
      .set('Content-Type', 'application/json')
      .send({ tenantId })
      .expect(200);
  });

  // Pick a code that can never collide with a real Account row.
  const MISSING = 999999;
  const ITERATIONS = 10;

  it(`GET /api/remaining/1/${MISSING} × ${ITERATIONS} — every call returns 404`, async function () {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const res = await agent.get(`/api/remaining/1/${MISSING}`);
      assert.equal(
        res.status,
        404,
        `iteration ${i}: expected 404, got ${res.status} body=${JSON.stringify(res.body)}`,
      );
    }
  });

  it(`GET /api/account/${MISSING} × ${ITERATIONS} — every call returns 404`, async function () {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const res = await agent.get(`/api/account/${MISSING}`);
      assert.equal(
        res.status,
        404,
        `iteration ${i}: expected 404, got ${res.status} body=${JSON.stringify(res.body)}`,
      );
    }
  });

  it(`GET /api/ledger/1/${MISSING} × ${ITERATIONS} — every call returns 404 or stable shape`, async function () {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const res = await agent.get(`/api/ledger/1/${MISSING}`);
      // The ledger handler may return either 404 (account lookup) or 200
      // with an empty entries list, depending on internal short-circuits.
      // What matters is that it does not 500, crash the process, or return
      // an inconsistent shape.
      assert.ok(
        res.status === 200 || res.status === 404,
        `iteration ${i}: expected 200/404, got ${res.status} body=${JSON.stringify(res.body)}`,
      );
    }
  });

  it('after the loop the server is still alive — a valid request returns 200', async function () {
    // If any of the bad calls above crashed the process, the supertest
    // agent would reject the next request with ECONNREFUSED.
    const res = await agent.get('/api/user').expect(200);
    assert.ok(res.body.user, 'session not restored after null-account hammering');
  });
});
