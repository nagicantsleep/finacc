import { getProject, listProjects } from '$lib/server/master/project-api.js';

const VIEW_STATES = new Set(['list', 'entry', 'new', 'home', 'labels', 'settings', 'summary']);

export function parseProjectView(rest) {
  const raw = Array.isArray(rest) ? rest.join('/') : String(rest || '');
  const parts = raw.split('/').filter(Boolean);
  const viewState = parts[0] || 'list';
  const needsId = viewState === 'entry' || viewState === 'settings' || viewState === 'summary';
  const resourceId = needsId ? parseInt(parts[1], 10) : NaN;

  if (!VIEW_STATES.has(viewState)) {
    return { viewState: null, resourceId: null };
  }
  if (needsId && !Number.isFinite(resourceId)) {
    return { viewState: null, resourceId: null };
  }

  return {
    viewState,
    resourceId: Number.isFinite(resourceId) ? resourceId : null
  };
}

export function newProjectTemplate() {
  return {};
}

export async function loadProjectPageData({ tenantId, viewState, resourceId }) {
  if (viewState === 'list') {
    const projects = await listProjects(tenantId);
    return { projects, selectedProject: null };
  }

  if (viewState === 'new') {
    return { projects: [], selectedProject: newProjectTemplate() };
  }

  if (viewState === 'entry') {
    const selectedProject = await getProject(tenantId, resourceId);
    return { projects: [], selectedProject };
  }

  if (viewState === 'summary') {
    const projects = await listProjects(tenantId);
    return { projects, selectedProject: null };
  }

  if (viewState === 'settings') {
    const selectedProject = await getProject(tenantId, resourceId);
    return { projects: [], selectedProject };
  }

  return { projects: [], selectedProject: null };
}
