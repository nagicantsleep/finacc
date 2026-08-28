import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { Readable } from 'node:stream';
import { format, parse } from '@formkit/tempo';
import { json } from '@sveltejs/kit';
import { sequelize } from '$lib/server/db/index.js';
import { forbidden, requireTenant } from '$lib/server/api-guard.js';

const execFileAsync = promisify(execFile);

const RESTORE_DISABLED_MESSAGE =
  'Database-level restore is disabled in multi-tenant environment to prevent data loss across tenants. Please contact system administrator.';

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pgConfig() {
  const c = sequelize.config || {};
  return {
    database: c.database || process.env.DB_NAME || 'hieronymus_dev',
    username: c.username || process.env.DB_USER || 'hieronymus',
    password: c.password || process.env.DB_PASSWORD || 'hieronymus',
    host: c.host || process.env.DB_HOST || '127.0.0.1',
    port: String(c.port || process.env.DB_PORT || '5432')
  };
}

function backupDir() {
  return path.resolve(process.cwd(), process.env.BACKUP_DIR || './backups');
}

function dumpPath(stamp) {
  const { database } = pgConfig();
  return path.join(backupDir(), `${database}-${stamp}.dump`);
}

function pgEnv() {
  return { ...process.env, PGPASSWORD: pgConfig().password };
}

async function runPg(bin, args) {
  await execFileAsync(bin, args, { env: pgEnv(), windowsHide: true, maxBuffer: 20 * 1024 * 1024 });
}

export function requireAdmin(locals) {
  const denied = requireTenant(locals);
  if (denied) return denied;
  if (!locals.user?.administrable) return forbidden();
  return null;
}

export async function listBackupDates() {
  const dir = backupDir();
  await mkdir(dir, { recursive: true });
  const { database } = pgConfig();
  const rex = new RegExp(`^${escapeRegExp(database)}-(.+)\\.dump$`);
  const list = await readdir(dir);
  const files = [];
  for (const ent of list) {
    const m = ent.match(rex);
    if (!m) continue;
    const d = parse(m[1], 'YYYYMMDDHHmmss');
    if (d) files.push(d);
  }
  files.sort((a, b) => b.valueOf() - a.valueOf());
  return files;
}

export async function createBackup() {
  const dir = backupDir();
  await mkdir(dir, { recursive: true });
  const { database, username, host, port } = pgConfig();
  const stamp = format(new Date(), 'YYYYMMDDHHmmss');
  const filePath = dumpPath(stamp);
  await runPg('pg_dump', ['-U', username, '-h', host, '-p', port, '-b', '-f', filePath, database]);
}

function stampFromDateInput(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return format(date, 'YYYYMMDDHHmmss');
}

export async function deleteBackup(dateValue) {
  const stamp = stampFromDateInput(dateValue);
  if (!stamp) throw new Error('invalid date');
  await rm(dumpPath(stamp));
}

export function downloadBackupResponse(dateValue) {
  const stamp = stampFromDateInput(dateValue);
  if (!stamp) return json({ code: -1, message: 'invalid date' }, { status: 400 });
  const filePath = dumpPath(stamp);
  const stream = createReadStream(filePath);
  return new Response(Readable.toWeb(stream), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`
    }
  });
}

export async function uploadBackupFile(file) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('file is required');
  }
  const dir = backupDir();
  await mkdir(dir, { recursive: true });
  const stamp = format(new Date(), 'YYYYMMDDHHmmss');
  const dest = dumpPath(stamp);
  if (typeof file.path === 'string' && file.path) {
    await copyFile(file.path, dest);
    await rm(file.path).catch(() => {});
    return;
  }
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, buf);
}

export async function restoreBackup(dateValue) {
  if (process.env.ALLOW_DATABASE_RESTORE !== 'true') {
    const err = new Error(RESTORE_DISABLED_MESSAGE);
    err.status = 403;
    throw err;
  }
  const stamp = stampFromDateInput(dateValue);
  if (!stamp) throw new Error('invalid date');
  const filePath = dumpPath(stamp);
  const { database, username, host, port } = pgConfig();
  await runPg('dropdb', ['-U', username, '-h', host, '-p', port, '-f', database]);
  await runPg('createdb', ['-U', username, '-h', host, '-p', port, database]);
  await runPg('psql', ['-U', username, '-h', host, '-p', port, '-f', filePath, database]);
}

export { RESTORE_DISABLED_MESSAGE };
