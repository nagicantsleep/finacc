/**
 * Core-flow smoke — Issue #295.
 *
 * End-to-end happy path:
 *   signup → login → select tenant → setup fiscal year → ledger
 *   → trial balance → simulation → logout
 *
 * Each step is an HTTP round-trip against the real app (no DB mocks). The
 * goal is to catch wiring regressions (route guards, session handling,
 * tenant resolution, model wiring) in CI without needing a browser.
 *
 * Run with: npm run test:e2e
 */

import { strict as assert } from 'node:assert';
import { signupAndLogin, freshUser, isOk } from '../setup.js';

describe('Smoke — core flow (logon → tenant → setup → ledger → TB → sim → logout)', function () {
  this.timeout(30000);

  let agent;
  let tenantId;

  before(async function () {
    agent = await signupAndLogin(freshUser('smoke'));
  });

  it('1) logon — /api/user returns the logged-in user', async function () {
    const res = await agent.get('/api/user').expect(200);
    assert.ok(res.body.user, 'user field missing');
    assert.ok(res.body.user.id, 'user.id missing');
  });

  it('2) tenant — /api/user/tenants lists at least one tenant', async function () {
    const res = await agent.get('/api/user/tenants').expect(200);
    assert.ok(Array.isArray(res.body.tenants), 'tenants should be an array');
    assert.ok(res.body.tenants.length >= 1, 'expected at least one tenant after bootstrap');
    tenantId = res.body.tenants[0].tenantId;
  });

  it('2b) select-tenant binds the session to a tenant', async function () {
    const res = await agent
      .post('/api/user/select-tenant')
      .set('Content-Type', 'application/json')
      .send({ tenantId })
      .expect(200);
    isOk(res, 'select-tenant');
  });

  it('3) setup — POST /api/setup creates a fiscal year and binds session.term', async function () {
    const res = await agent
      .post('/api/setup')
      .set('Content-Type', 'application/json')
      .send({
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        term: 1,
        year: 2026,
        companyClass: 0,
        roundingMethod: 0,
      });
    // 0 = created, -1 = already set up (acceptable for re-runs against a
    // non-empty test DB). Anything else is a real failure.
    assert.ok(
      res.body.code === 0 || res.body.code === -1,
      `setup failed: ${JSON.stringify(res.body)}`,
    );
  });

  it('4) accounts — GET /api/accounts returns the seeded chart of accounts', async function () {
    const res = await agent.get('/api/accounts').expect(200);
    const lines = Array.isArray(res.body) ? res.body : res.body.accounts || [];
    assert.ok(lines.length > 0, 'no accounts returned — setup may have failed silently');
    // Each line must expose a code so we can drive the ledger step.
    const first = lines[0];
    const code = first.code || first.accountCode;
    assert.ok(code, 'account line missing code/accountCode');
  });

  it('5) ledger — GET /api/ledger/1/<code> returns a stable response shape', async function () {
    const accRes = await agent.get('/api/accounts').expect(200);
    const lines = Array.isArray(accRes.body) ? accRes.body : accRes.body.accounts || [];
    const code = (lines[0].code || lines[0].accountCode).toString();
    const res = await agent.get(`/api/ledger/1/${encodeURIComponent(code)}`);
    // Empty tenant → 200 with no rows; bad code → 404. Both are valid
    // smoke outcomes; what matters is that the route is wired and the
    // tenant guard does not 401 us.
    assert.ok(
      res.status === 200 || res.status === 404,
      `ledger returned ${res.status}: ${JSON.stringify(res.body)}`,
    );
  });

  it('6) trial balance — GET /api/trial-balance?version=2 returns a v2 payload', async function () {
    const res = await agent.get('/api/trial-balance?version=2').expect(200);
    // v2 contract: { version: 2, meta: { totals, ... }, lines: [...] }
    assert.equal(res.body.version, 2, `TB version mismatch: ${JSON.stringify(res.body).slice(0, 200)}`);
    assert.ok(res.body.meta, 'TB meta missing');
    assert.ok(Array.isArray(res.body.lines), 'TB lines must be an array');
    // Global D === C invariant (zero-sum is fine for an empty tenant).
    if (res.body.meta.totals) {
      const t = res.body.meta.totals;
      assert.equal(
        t.endingDebit ?? 0,
        t.endingCredit ?? 0,
        'TB ending debit/credit imbalance',
      );
    }
  });

  it('7) simulation — GET /api/simulation/scenarios returns a list', async function () {
    const res = await agent.get('/api/simulation/scenarios').expect(200);
    assert.equal(res.body.result, 'OK', `sim list error: ${JSON.stringify(res.body)}`);
    assert.ok(Array.isArray(res.body.scenarios), 'scenarios must be an array');
  });

  it('8) logout — POST /api/user/logoff returns OK and session is dead', async function () {
    const res = await agent.post('/api/user/logoff');
    assert.ok(
      res.status === 200 || res.status === 302,
      `unexpected logout status ${res.status}: ${JSON.stringify(res.body)}`,
    );
    // After logout, the server should no longer recognize the session.
    // Accept 302 (redirect to /login) as a valid "not authenticated" outcome.
    const after = await agent.get('/api/user');
    assert.ok(
      after.status === 302 || (after.status >= 400 && after.status < 500),
      `expected 4xx or 302 after logout, got ${after.status}`,
    );
  });
});
