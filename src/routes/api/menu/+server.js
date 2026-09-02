import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
const Op = models.Sequelize.Op;

export async function GET({ locals, url }) {
  if (!locals.user || !locals.tenantId) {
    return json({ menus: [] });
  }

  const tenantId = locals.tenantId;
  const menus = await models.Menu.findAll({
    where: {
      tenantId,
      userId: locals.user.id,
      displayOrder: { [Op.gt]: 0 }
    },
    order: [['displayOrder', 'ASC']],
    include: [{ model: models.User, as: 'user' }]
  });

  return json({ menus });
}

export async function POST({ locals, request }) {
  if (!locals.user || !locals.tenantId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  body.tenantId = locals.tenantId;
  body.userId = locals.user.id;

  const menu = await models.Menu.create(body);
  return json({ menu });
}

export async function PUT({ locals, request }) {
  if (!locals.user || !locals.tenantId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = locals.tenantId;
  const body = await request.json();

  if (body.menus && Array.isArray(body.menus)) {
    for (const m of body.menus) {
      const patch = { ...m };
      delete patch.tenantId;
      if (patch.id) {
        const existing = await models.Menu.findOne({ where: { tenantId, id: patch.id } });
        if (existing) {
          delete patch.id;
          existing.set(patch);
          existing.tenantId = tenantId;
          await existing.save();
        }
      } else {
        await models.Menu.create({ ...patch, tenantId, userId: locals.user.id });
      }
    }

    const menus = await models.Menu.findAll({
      where: {
        tenantId,
        userId: locals.user.id,
        displayOrder: { [Op.gt]: 0 }
      },
      order: [['displayOrder', 'ASC']],
      include: [{ model: models.User, as: 'user' }]
    });

    return json({ menus });
  }

  if (body.id) {
    const existing = await models.Menu.findOne({ where: { tenantId, id: body.id } });
    if (existing) {
      const patch = { ...body };
      delete patch.id;
      delete patch.tenantId;
      existing.set(patch);
      existing.tenantId = tenantId;
      await existing.save();
      return json({ menu: existing });
    }
  }

  return json({ result: 'OK' });
}
