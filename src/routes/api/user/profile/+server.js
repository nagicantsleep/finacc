import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function PUT({ locals, request }) {
  if (!locals.user) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { legalName, legalRuby, email, telNo } = body;

  const user = await models.User.findByPk(locals.user.id);
  if (!user) {
    return json({ result: 'NG', message: 'User not found' }, { status: 404 });
  }

  user.legalName = legalName;
  user.legalRuby = legalRuby;
  user.email = email;
  user.telNo = telNo;
  await user.save();

  return json({ result: 'OK', user: { id: user.id, name: user.name, legalName, email } });
}
