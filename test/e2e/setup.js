/**
 * E2E / smoke harness — Issue #295.
 *
 * Shared fixtures for HTTP-level smoke tests. Each spec signs up a fresh user
 * (unique-per-run name) and reuses the session via supertest's agent. The
 * harness intentionally avoids mocking the DB so it exercises the real route
 * handlers, models, and tenant guards.
 *
 * Usage:
 *   import { signupAndLogin, freshUser, isOk } from '../setup.js';
 *
 * No global before/after here — every spec owns its own fixtures so they
 * stay runnable in any order.
 */

import { strict as assert } from 'node:assert';
import request from 'supertest';
import app from '../../app.js';

let SEQ = 0;

/**
 * Build a unique user record for the current test run.
 * @param {string} tag short tag (e.g. "smoke") used in the name.
 */
export function freshUser(tag) {
  const RUN = Date.now().toString(36);
  SEQ += 1;
  const name = `e2e_${tag}_${RUN.slice(-4)}${SEQ.toString(36)}`.slice(0, 20);
  return {
    name,
    password: 'password-1234',
    legalName: `E2E ${tag}`,
    email: `${name}@example.com`,
  };
}

/**
 * Sign up + log in. Returns a supertest agent carrying the session cookie.
 * Tolerant of "already registered" (re-runs on a non-empty DB).
 */
export async function signupAndLogin(user) {
  const agent = request.agent(app);

  const signupRes = await agent
    .post('/api/user/signup')
    .send({
      user_name: user.name,
      password: user.password,
      legalName: user.legalName,
      email: user.email,
    })
    .expect('Content-Type', /json/);

  assert.ok(
    signupRes.body.result === 'OK' ||
      (signupRes.body.message || '').includes('既に登録'),
    `signup unexpected: ${JSON.stringify(signupRes.body)}`,
  );

  const loginRes = await agent
    .post('/api/user/login')
    .send({ user_name: user.name, password: user.password })
    .expect(200);

  assert.equal(loginRes.body.result, 'OK', `login failed: ${JSON.stringify(loginRes.body)}`);

  return agent;
}

/**
 * Assert a JSON response is shaped as { result: 'OK', ... }.
 */
export function isOk(res, label) {
  assert.equal(res.body && res.body.result, 'OK', `${label}: expected result=OK, got ${JSON.stringify(res.body)}`);
}
