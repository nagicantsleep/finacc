import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const user = process.env.FINACC_LOGIN_USER || process.env.HIERONYMUS_LOGIN_USER || 'creator';
const password = process.env.FINACC_LOGIN_PASSWORD || process.env.HIERONYMUS_LOGIN_PASSWORD || 'secret';
const baseURL = process.env.FINACC_BASE_URL || process.env.HIERONYMUS_BASE_URL || 'http://localhost:3010';

const env = {
  ...process.env,
  FINACC_BASE_URL: baseURL,
  FINACC_LOGIN_USER: user,
  FINACC_LOGIN_PASSWORD: password,
  HIERONYMUS_BASE_URL: baseURL,
  HIERONYMUS_LOGIN_USER: user,
  HIERONYMUS_LOGIN_PASSWORD: password
};

const transport = new StdioClientTransport({
  command: 'node',
  args: ['index.js'],
  cwd: __dirname,
  env: env,
  stderr: process.stderr,
});

const client = new Client({ name: 'voucher-mcp-test', version: '0.1.0' });
await client.connect(transport);

const call = async (name, args) => {
  const res = await client.callTool({ name, arguments: args });
  const txt = res.content && res.content[0] ? res.content[0].text : '';
  const tag = res.isError ? '[ERROR]' : '[OK]';
  process.stdout.write(`\n == ${name} ${tag} ==\n${txt.slice(0, 500)}\n`);
  return res;
};

const mode = process.env.MODE || 'read';
if (mode === 'read') {
  await call('get_fiscal_year', { year: 2026, month: 3 });
  await call('get_accounts', {});
  await call('get_companies', {});
  await call('get_voucher_classes', {});
  await call('get_tax_rules', { date: '2026-03-01' });
  await call('compute_slip_taxes', {
    year: 2026, month: 3,
    lines: [{ debitAccount: '7000001', debitAmount: 10000, debitTaxRuleId: 7, creditAccount: '1000001', creditAmount: 11000 }]
  });
} else if (mode === 'create') {
  const res = await call('create_cross_slip', {
    year: 2026, month: 3, day: 22,
    lines: [{ debitAccount: '7000001', debitAmount: 10000, debitTaxRuleId: 7, creditAccount: '1000001', creditAmount: 11000, application1: 'test via mcp' }]
  });
  await call('list_cross_slips', {});
  await call('create_voucher', { voucherClassId: 1, issueDate: '2026-03-22', companyId: 1, amount: 10000, taxRuleId: 7 });
} else if (mode === 'approve') {
  await call('list_cross_slips', {});
  await call('approve_cross_slip', { year: 2026, month: 3, no: 1 });
  await call('disapprove_cross_slip', { year: 2026, month: 3, no: 1 });
}

await client.close();
process.exit(0);
