/**
 * Bilingual smoke — Issue #295.
 *
 * Regression for the language-pair selector (#108) and the navbar fiscal-year
 * header (#110). After signup + login + tenant select, follows the natural
 * page-load chain (`/` or `/home` → `/setup` for fresh users) and asserts:
 *   - the response is HTML 200
 *   - the language selector renders a label, not `undefined` or raw `/`
 *   - the fiscal-year header has no fragmented slash token
 *
 * Run with: npm run test:smoke
 */

import { strict as assert } from 'node:assert';
import { signupAndLogin, freshUser } from '../setup.js';

describe('Smoke — bilingual display (navbar + language selector)', function () {
  this.timeout(30000);

  let agent;
  let tenantId;

  before(async function () {
    agent = await signupAndLogin(freshUser('bili'));
    const tenants = await agent.get('/api/user/tenants').expect(200);
    assert.ok(tenants.body.tenants && tenants.body.tenants.length >= 1, 'no tenant');
    tenantId = tenants.body.tenants[0].tenantId;
    await agent
      .post('/api/user/select-tenant')
      .set('Content-Type', 'application/json')
      .send({ tenantId })
      .expect(200);
  });

  it('SSR /home follows redirects and returns HTML 200', async function () {
    // Fresh tenant has no fiscal year → /home redirects to /setup.
    // We follow up to 2 hops to land on the actual rendered page.
    const res = await agent.get('/home').redirects(2);
    assert.ok(res.status === 200, `expected 200 after redirects, got ${res.status}`);
    assert.match(res.headers['content-type'] || '', /html/);
    assert.ok(res.text.length > 0, 'empty body');
  });

  it('language selector does not render `undefined` or raw `/` as a label', async function () {
    const res = await agent.get('/home').redirects(2).expect(200);
    const html = res.text;
    assert.equal(
      html.includes('>undefined<'),
      false,
      'language selector still contains an `undefined` option label',
    );
    assert.equal(
      /value="[^"]*"[^>]*>\s*\/\s*</.test(html),
      false,
      'language selector still contains a `/`-only option label',
    );
  });

  it('navbar fiscal-year header has no fragmented bilingual tokens', async function () {
    const res = await agent.get('/home').redirects(2).expect(200);
    const html = res.text;
    // Heuristic: the fiscal header used to render with the slash broken
    // across nodes. We assert that no `<…>>/ <…` pattern survives.
    const hasFragmentedSlash = />\s*\/\s*</.test(html);
    assert.equal(
      hasFragmentedSlash,
      false,
      'navbar fiscal-year header still has a fragmented `/` token (issue #110)',
    );
  });
});
