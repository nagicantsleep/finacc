import { json } from '@sveltejs/kit';

export async function GET({ url }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return new Response(null, {
    status: 307,
    headers: {
      Location: `/api/journal/${year}/${month}`
    }
  });
}
