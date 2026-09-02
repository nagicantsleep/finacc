import { json } from '@sveltejs/kit';

export function GET() {
  return json({
    version: '2.0.7',
    app: 'Hieronymus'
  });
}
