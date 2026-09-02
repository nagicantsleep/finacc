import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) {
  throw redirect(301, `/workspace/${params.id}`);
}
