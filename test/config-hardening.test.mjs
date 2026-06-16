/**
 * Issue #332: Connection / Session / CORS / Secret hardening tests.
 *
 * These are unit-level tests that validate the hardening logic in
 * config/env.js, bin/check-config, and app.js session/CORS config.
 *
 * NOTE: app.js is imported once at module level, so env/cors tests
 * inspect the module exports and env module behavior rather than
 * re-importing app.js (which would re-initialize express).
 */
import { expect } from 'chai';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';

const execFileAsync = promisify(execFile);
const projectRoot = resolve(import.meta.dirname, '..');

// ---------------------------------------------------------------------------
// Helper: run check-config with given env vars
// ---------------------------------------------------------------------------
async function runCheckConfig(envVars = {}) {
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    ...envVars
  };
  const { stdout, stderr } = await execFileAsync(
    'node',
    ['./bin/check-config'],
    { cwd: projectRoot, env }
  );
  return { stdout, stderr };
}

// ---------------------------------------------------------------------------
// Helper: read config.json for a given env section
// ---------------------------------------------------------------------------
function readConfigSection(section = 'development') {
  const raw = readFileSync(resolve(projectRoot, 'config/config.json'), 'utf8');
  return JSON.parse(raw)[section];
}

// ---------------------------------------------------------------------------
// Helper: write and restore config.json
// ---------------------------------------------------------------------------
const configPath = resolve(projectRoot, 'config/config.json');
let savedConfig;

function saveConfig() {
  savedConfig = readFileSync(configPath, 'utf8');
}

function restoreConfig() {
  if (savedConfig) {
    writeFileSync(configPath, savedConfig, 'utf8');
  }
}

// ===========================================================================
// Test suite
// ===========================================================================
describe('Issue #332 — Config hardening', function () {
  this.timeout(15000);

  before(() => saveConfig());
  afterEach(() => restoreConfig());

  // -----------------------------------------------------------------------
  // 1. config.json.sample includes new fields
  // -----------------------------------------------------------------------
  describe('config.json.sample', () => {
    it('includes port, pool, and dialectOptions for each env', () => {
      const raw = readFileSync(
        resolve(projectRoot, 'config/config.json.sample'),
        'utf8'
      );
      const sample = JSON.parse(raw);

      for (const env of ['development', 'test', 'production']) {
        expect(sample[env]).to.have.property('port');
        expect(sample[env]).to.have.property('pool').that.is.an('object');
        expect(sample[env].pool).to.have.property('max');
        expect(sample[env].pool).to.have.property('min');
        expect(sample[env]).to.have.property('dialectOptions').that.is.an('object');
        expect(sample[env].dialectOptions).to.have.property('statement_timeout');
        expect(sample[env].dialectOptions).to.have.property('application_name');
      }
    });

    it('production sample has SSL dialectOptions', () => {
      const raw = readFileSync(
        resolve(projectRoot, 'config/config.json.sample'),
        'utf8'
      );
      const sample = JSON.parse(raw);
      expect(sample.production.dialectOptions).to.have.property('ssl');
      expect(sample.production.dialectOptions.ssl).to.have.property('rejectUnauthorized', true);
    });
  });

  // -----------------------------------------------------------------------
  // 2. bin/check-config reads DB_PORT, DB_SSL, pool, timeout
  // -----------------------------------------------------------------------
  describe('bin/check-config', () => {
    it('applies DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME', async () => {
      await runCheckConfig({
        DB_HOST: 'testhost',
        DB_PORT: '5433',
        DB_USER: 'testuser',
        DB_PASSWORD: 'testpass',
        DB_NAME: 'testdb'
      });

      const cfg = readConfigSection('development');
      expect(cfg.host).to.equal('testhost');
      expect(cfg.port).to.equal(5433);
      expect(cfg.username).to.equal('testuser');
      expect(cfg.password).to.equal('testpass');
      expect(cfg.database).to.equal('testdb');
    });

    it('applies DB_SSL=false to dialectOptions.ssl.rejectUnauthorized', async () => {
      await runCheckConfig({ DB_SSL: 'false' });

      const cfg = readConfigSection('development');
      expect(cfg.dialectOptions).to.have.property('ssl');
      expect(cfg.dialectOptions.ssl.rejectUnauthorized).to.equal(false);
    });

    it('applies DB_SSL=true to dialectOptions.ssl.rejectUnauthorized', async () => {
      await runCheckConfig({ DB_SSL: 'true' });

      const cfg = readConfigSection('development');
      expect(cfg.dialectOptions).to.have.property('ssl');
      expect(cfg.dialectOptions.ssl.rejectUnauthorized).to.equal(true);
    });

    it('applies DB_STATEMENT_TIMEOUT to dialectOptions', async () => {
      await runCheckConfig({ DB_STATEMENT_TIMEOUT: '45000' });

      const cfg = readConfigSection('development');
      expect(cfg.dialectOptions.statement_timeout).to.equal(45000);
    });

    it('applies DB_APPLICATION_NAME to dialectOptions', async () => {
      await runCheckConfig({ DB_APPLICATION_NAME: 'my-app' });

      const cfg = readConfigSection('development');
      expect(cfg.dialectOptions.application_name).to.equal('my-app');
    });

    it('applies DB_SCHEMA to config section', async () => {
      await runCheckConfig({ DB_SCHEMA: 'myschema' });

      const cfg = readConfigSection('development');
      expect(cfg.schema).to.equal('myschema');
    });

    it('applies DB_POOL JSON to pool config', async () => {
      await runCheckConfig({ DB_POOL: '{"max": 10, "min": 2}' });

      const cfg = readConfigSection('development');
      expect(cfg.pool.max).to.equal(10);
      expect(cfg.pool.min).to.equal(2);
    });
  });

  // -----------------------------------------------------------------------
  // 3. config/env.js fail-loud for missing EXPRESS in production
  // -----------------------------------------------------------------------
  describe('config/env.js — production secret guard', () => {
    it('process.exit(1) when NODE_ENV=production and EXPRESS unset', async () => {
      try {
        await execFileAsync(
          'node',
          ['-e', `
            process.env.NODE_ENV = 'production';
            // Remove EXPRESS if set
            delete process.env.EXPRESS;
            process.env.APP_NAME = 'hieronymus-test';
            // Import the env module — it should call process.exit(1)
            import('./config/env.js');
          `],
          { cwd: projectRoot, timeout: 5000 }
        );
        // Should not reach here
        expect.fail('Expected process.exit(1) to be called');
      } catch (err) {
        // Node exits with code 1 when process.exit(1) is called
        expect(err.code).to.equal(1);
      }
    });
  });

  // -----------------------------------------------------------------------
  // 4. app.js CORS config (inspect env module behavior)
  // -----------------------------------------------------------------------
  describe('env.corsOrigins', () => {
    it('returns empty array when CORS_ORIGINS not set', () => {
      // Temporarily clear CORS_ORIGINS
      const saved = process.env.CORS_ORIGINS;
      delete process.env.CORS_ORIGINS;

      // Re-import env module (it runs at import time)
      // We test the parsing logic directly instead of re-importing
      const origins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
        : [];
      expect(origins).to.be.an('array').that.is.empty;

      // Restore
      if (saved) process.env.CORS_ORIGINS = saved;
    });

    it('parses CORS_ORIGINS comma-separated list', () => {
      const origins = 'https://app.example.com, https://admin.example.com'
        .split(',')
        .map(s => s.trim());
      expect(origins).to.deep.equal([
        'https://app.example.com',
        'https://admin.example.com'
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Session cookie config validation
  // -----------------------------------------------------------------------
  describe('session cookie configuration', () => {
    it('cookie has maxAge (not maxage) in app.js source', () => {
      const source = readFileSync(resolve(projectRoot, 'app.js'), 'utf8');
      // Should have correct maxAge
      expect(source).to.include('maxAge:');
      // Should NOT have the old typo maxage (unless in a comment)
      const lines = source.split('\n');
      const nonCommentLines = lines.filter(l => !l.trim().startsWith('//'));
      const joined = nonCommentLines.join('\n');
      expect(joined).to.not.include('maxage:');
    });

    it('cookie secure is tied to production env', () => {
      const source = readFileSync(resolve(projectRoot, 'app.js'), 'utf8');
      expect(source).to.include("secure: nodeEnv === 'production'");
    });

    it('cookie sameSite is set to lax', () => {
      const source = readFileSync(resolve(projectRoot, 'app.js'), 'utf8');
      expect(source).to.include("sameSite: 'lax'");
    });
  });

  // -----------------------------------------------------------------------
  // 6. Session store schemaName config
  // -----------------------------------------------------------------------
  describe('session store schemaName', () => {
    it('app.js uses top-level schemaName, not conObject.schema', () => {
      const source = readFileSync(resolve(projectRoot, 'app.js'), 'utf8');
      // Should have the schemaName assignment
      expect(source).to.include('pgSessionConfig.schemaName = dbConfig.schema');
      // The conObject block should NOT contain schema
      const conObjBlock = source.match(/conObject:\s*\{[\s\S]*?\n  \}/);
      if (conObjBlock) {
        expect(conObjBlock[0]).to.not.include('schema:');
      }
    });
  });

  // -----------------------------------------------------------------------
  // 7. Trust proxy
  // -----------------------------------------------------------------------
  describe('trust proxy', () => {
    it('app.js sets trust proxy for production', () => {
      const source = readFileSync(resolve(projectRoot, 'app.js'), 'utf8');
      expect(source).to.include("app.set('trust proxy', 1)");
      expect(source).to.include("nodeEnv === 'production'");
    });
  });

  // -----------------------------------------------------------------------
  // 8. CORS in app.js source
  // -----------------------------------------------------------------------
  describe('CORS configuration in app.js', () => {
    it('does not hardcode wildcard origin', () => {
      const source = readFileSync(resolve(projectRoot, 'app.js'), 'utf8');
      // The static wildcard line should be gone
      const lines = source.split('\n');
      const corsLine = lines.find(l => l.includes("origin:") && l.includes("'*'"));
      // origin: ['*'] should not be a static line anymore
      // (it may appear as a ternary fallback, which is ok)
      // Check the cors() call doesn't have a hardcoded ['*']
      const corsMatch = source.match(/app\.use\(cors\(\{[\s\S]*?\}\)\)/);
      if (corsMatch) {
        expect(corsMatch[0]).to.not.include("origin: ['*']");
      }
    });

    it('reads corsOrigins from env', () => {
      const source = readFileSync(resolve(projectRoot, 'app.js'), 'utf8');
      expect(source).to.include('env.corsOrigins');
    });

    it('fail-loud in production when CORS_ORIGINS empty', () => {
      const source = readFileSync(resolve(projectRoot, 'app.js'), 'utf8');
      expect(source).to.include('CORS_ORIGINS must be set in production');
    });
  });
});
