import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

export async function GET() {
  try {
    await models.sequelize.authenticate();
    const modelCount = Object.keys(models).filter(k => k !== 'sequelize' && k !== 'Sequelize').length;

    return json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      modelsLoaded: modelCount
    });
  } catch (error) {
    return json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'failed',
      error: error.message
    }, { status: 500 });
  }
}
