import { json } from '@sveltejs/kit';
import {
  RESTORE_DISABLED_MESSAGE,
  createBackup,
  deleteBackup,
  downloadBackupResponse,
  listBackupDates,
  requireAdmin,
  restoreBackup,
  uploadBackupFile
} from '$lib/server/admin-backup.js';

function partsFrom(url) {
  return url.pathname.replace(/^\/api\/admin\/?/, '').split('/').filter(Boolean);
}

function dateFromParts(parts) {
  if (parts[0] !== 'backup' || parts.length < 2) return null;
  return decodeURIComponent(parts.slice(1).join('/'));
}

export async function GET(event) {
  const denied = requireAdmin(event.locals);
  if (denied) return denied;
  const parts = partsFrom(event.url);
  try {
    if (parts[0] === 'backups' && !parts[1]) {
      const files = await listBackupDates();
      return json(files);
    }
    if (parts[0] === 'backup' && parts[1]) {
      return downloadBackupResponse(dateFromParts(parts));
    }
    return json({ code: -1, message: 'Not found' }, { status: 404 });
  } catch (e) {
    console.error('GET /api/admin', e);
    return json({ code: -1, message: e.message }, { status: 500 });
  }
}

export async function POST(event) {
  const denied = requireAdmin(event.locals);
  if (denied) return denied;
  const parts = partsFrom(event.url);
  try {
    if (parts[0] === 'backup' && !parts[1]) {
      await createBackup();
      return json({ code: 0 });
    }
    if (parts[0] === 'restore') {
      const body = await event.request.json().catch(() => ({}));
      await restoreBackup(body.date);
      return json({ code: 0 });
    }
    if (parts[0] === 'upload') {
      const form = await event.request.formData();
      const file = form.get('file');
      await uploadBackupFile(file);
      return json({ code: 0 });
    }
    return json({ code: -1, message: 'Not found' }, { status: 404 });
  } catch (e) {
    if (e.status === 403) {
      return json({ code: -1, message: e.message || RESTORE_DISABLED_MESSAGE }, { status: 403 });
    }
    console.error('POST /api/admin', e);
    if (parts[0] === 'restore') return json({ code: -1 });
    return json({ code: -1, message: e.message }, { status: 500 });
  }
}

export async function DELETE(event) {
  const denied = requireAdmin(event.locals);
  if (denied) return denied;
  const parts = partsFrom(event.url);
  try {
    const dateValue = dateFromParts(parts);
    if (!dateValue) return json({ code: -1, message: 'Not found' }, { status: 404 });
    await deleteBackup(dateValue);
    return json({ code: 0 });
  } catch (e) {
    console.error('DELETE /api/admin', e);
    return json({ code: -1 });
  }
}
