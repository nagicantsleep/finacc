import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ parent }) {
  const { currentFy } = await parent();
  const d = currentFy?.startDate ? new Date(currentFy.startDate) : new Date();
  throw redirect(303, `/journal/${d.getFullYear()}/${d.getMonth() + 1}`);
}
