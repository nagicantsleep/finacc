import { json } from '@sveltejs/kit';

export function unauthorized(message = 'Unauthorized') {
  return json({ code: -1, message }, { status: 401 });
}

export function forbidden(message = 'permission denied') {
  return json({ code: -10, message }, { status: 403 });
}

export function notFound() {
  return json({ code: -1 }, { status: 404 });
}

export function requireTenant(locals) {
  if (!locals?.user || !locals?.tenantId) {
    return unauthorized();
  }
  return null;
}

export function asJson(row) {
  if (row == null) return null;
  return typeof row.toJSON === 'function' ? row.toJSON() : row;
}
