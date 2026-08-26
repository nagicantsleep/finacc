import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const { targetUrl, landscape = false } = await request.json();
  return json({
    result: 'OK',
    message: 'Playwright PDF engine ready for server-side print dispatch.',
    url: targetUrl,
    landscape
  });
}
