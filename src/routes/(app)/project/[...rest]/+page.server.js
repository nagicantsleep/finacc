import { error, redirect } from '@sveltejs/kit';
import { NOT_FOUND_MESSAGE } from '$lib/errors.js';
import { loadProjectPageData, parseProjectView } from '$lib/server/master/project-page.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, params, depends }) {
  depends('app:project');
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const { viewState, resourceId } = parseProjectView(params.rest);
  if (!viewState) {
    throw error(404, NOT_FOUND_MESSAGE);
  }

  const pageData = await loadProjectPageData({
    tenantId: locals.tenantId,
    viewState,
    resourceId
  });

  if (viewState === 'entry' && !pageData.selectedProject) {
    throw error(404, NOT_FOUND_MESSAGE);
  }
  if (viewState === 'settings' && !pageData.selectedProject) {
    throw error(404, NOT_FOUND_MESSAGE);
  }

  return {
    ...pageData,
    viewState,
    resourceId
  };
}
