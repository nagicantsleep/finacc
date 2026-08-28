import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET({ locals }) {
  if (!locals.user) {
    return json({ result: 'OK', languagePair: { primary: 'ja', secondary: 'vi' }, source: 'default' });
  }

  const user = await models.User.findByPk(locals.user.id);
  if (user && user.languagePair) {
    return json({ result: 'OK', languagePair: user.languagePair, source: 'user' });
  }

  return json({ result: 'OK', languagePair: { primary: 'ja', secondary: 'vi' }, source: 'system' });
}

export async function PUT({ locals, request }) {
  if (!locals.user) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { primary, secondary } = body;

  const user = await models.User.findByPk(locals.user.id);
  if (user) {
    user.languagePair = { primary, secondary };
    await user.save();
  }

  return json({ result: 'OK', languagePair: { primary, secondary } });
}
