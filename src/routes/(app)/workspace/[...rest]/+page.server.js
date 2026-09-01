import { error, redirect } from '@sveltejs/kit';
import { NOT_FOUND_MESSAGE } from '$lib/errors.js';
import { loadWorkspacePageData, parseWorkspaceView } from '$lib/server/master/workspace-page.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, params, depends }) {
  depends('app:workspace');
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const { viewState, workspaceId } = parseWorkspaceView(params.rest);
  if (!viewState) {
    throw error(404, NOT_FOUND_MESSAGE);
  }

  const pageData = await loadWorkspacePageData({
    tenantId: locals.tenantId,
    userId: locals.user.id,
    user: locals.user,
    term: locals.term,
    viewState,
    workspaceId
  });

  if (viewState === 'entry' && !pageData.workspace) {
    throw error(404, NOT_FOUND_MESSAGE);
  }

  return {
    ...pageData,
    viewState,
    workspaceId
  };
}
