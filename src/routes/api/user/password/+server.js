import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import bcrypt from 'bcrypt';

export async function PUT({ locals, request }) {
  if (!locals.user) {
    return json({ result: 'NG', message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  const user = await models.User.findByPk(locals.user.id);
  if (!user) {
    return json({ result: 'NG', message: 'User not found' }, { status: 404 });
  }

  const matches = (user.hashPassword && bcrypt.compareSync(currentPassword, user.hashPassword)) ||
                  (user.password && user.password === currentPassword);

  if (!matches) {
    return json({ result: 'NG', message: 'Current password is incorrect' }, { status: 400 });
  }

  user.hashPassword = bcrypt.hashSync(newPassword, 10);
  user.password = newPassword;
  await user.save();

  return json({ result: 'OK' });
}
