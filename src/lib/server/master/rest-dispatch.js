import { json } from '@sveltejs/kit';
import { requireTenant } from '$lib/server/api-guard.js';

async function parseBody(request, method) {
  if (method === 'GET' || method === 'HEAD') return {};
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function restHandlers(handle) {
  const run = async (method, event) => {
    const denied = requireTenant(event.locals);
    if (denied) return denied;
    const body = await parseBody(event.request, method);
    return handle(method, {
      locals: event.locals,
      url: event.url,
      body,
      getClientAddress: event.getClientAddress
    });
  };
  return {
    GET: (event) => run('GET', event),
    POST: (event) => run('POST', event),
    PUT: (event) => run('PUT', event),
    DELETE: (event) => run('DELETE', event)
  };
}

export { json };
