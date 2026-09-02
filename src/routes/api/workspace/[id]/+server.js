import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ params, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ workspace: null, menu: null });
  }

  const menu = await models.Menu.findOne({
    where: { tenantId: locals.tenantId, id: params.id }
  });

  return json({ workspace: menu, menu });
}

export async function PUT({ params, locals, request }) {
  if (!locals.user || !locals.tenantId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const menu = await models.Menu.findOne({
    where: { tenantId: locals.tenantId, id: params.id }
  });

  if (!menu) {
    return json({ error: 'Workspace not found' }, { status: 404 });
  }

  const patch = { ...body };
  delete patch.id;
  delete patch.tenantId;
  menu.set(patch);
  menu.tenantId = locals.tenantId;
  await menu.save();

  return json({ workspace: menu, menu });
}

export async function DELETE({ params, locals }) {
  if (!locals.user || !locals.tenantId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const menu = await models.Menu.findOne({
    where: { tenantId: locals.tenantId, id: params.id }
  });

  if (menu) {
    await menu.destroy();
  }

  return json({ code: 0 });
}
