<div class="page-title d-flex justify-content-between align-items-center">
  {#if isEditMode}
  <input type="text" class="col-8 form-control me-2"
  	bind:value={workspace.title}>
  <div class="d-flex align-items-center gap-2">
    <div class="dropdown" style="display: inline;">
      <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"><BilingualText key="add_widget" /></button>
      <ul class="dropdown-menu">
        {#each componentList as entry}
        {#if (entry.title)}
        <li>
          <button class="dropdown-item"
            draggable="true"
            data-type={entry.name}
            on:dragstart={startWidgetDrag}
            >
            {entry.title}
        	</button>
        </li>
        {/if}
        {/each}
      </ul>
    </div>
    <button class="btn btn-success" on:click={save}><BilingualText key="save_layout" /></button>
    <button class="btn link" on:click={() => {
      isEditMode = !isEditMode;
    }}><i class="bi bi-check"></i><BilingualText key="run_mode" /></button>
  </div>
  {:else}
  <h1>{workspace?.title || ''}</h1>
  <button class="btn link" on:click={() => {
    isEditMode = !isEditMode;
  }}><i class="bi bi-pencil"></i><BilingualText key="edit_mode" /></button>
	{/if}
</div>
<WorkspaceGrid
  bind:status={status}
  bind:toast={toast}
  bind:widgets={widgets}
  bind:isEditMode={isEditMode}
  reload={reload}
/>

<script>
import axios from 'axios';
import WorkspaceGrid from '../components/menu.svelte';
import { onMount, tick } from 'svelte';
import { get } from 'svelte/store';
import { goto, invalidate } from '$app/navigation';
import { currentMenu } from '$lib/client/current-record.js';
import { eventBus as tableBus } from '$lib/client/table-maintenance.js';
import menuBus from '$lib/client/event-bus.js';
import { componentList } from '$lib/client/widget-list.js';
import BilingualText from '$lib/components/BilingualText.svelte';

export let status;
export let toast;
export let initialWorkspace = { title: 'ホーム', widgets: [] };
export let viewState = 'default';
export let workspaceId = null;

let workspace = initialWorkspace;
let widgets = initialWorkspace?.widgets || [];
let reload = 0;
let isEditMode = false;
let loadedKey = '';

const startWidgetDrag = (event) => {
  const name = event.target.dataset.type;
  event.dataTransfer.setData('application/json', JSON.stringify({
    component: name
  }));
  event.dataTransfer.effectAllowed = 'copy';
};

const serializeWorkspace = () => ({
  id: workspace.id,
  title: workspace.title,
  displayOrder: workspace.displayOrder,
  body: JSON.stringify(widgets)
});

const deserializeWorkspace = (_ws) => {
  if (!_ws) return { title: 'ホーム', widgets: [] };
  let parsedWidgets = [];
  try {
    if (typeof _ws.body === 'string') {
      parsedWidgets = JSON.parse(_ws.body);
    } else if (Array.isArray(_ws.menu)) {
      parsedWidgets = _ws.menu;
    } else if (Array.isArray(_ws.widgets)) {
      parsedWidgets = _ws.widgets;
    }
  } catch {
    parsedWidgets = [];
  }
  return {
    id: _ws.id,
    title: _ws.title || 'ホーム',
    displayOrder: _ws.displayOrder,
    widgets: parsedWidgets
  };
};

const save = () => {
  try {
    let pr;
    let create = false;
    const _ws = serializeWorkspace();
    if (_ws.id) {
      _ws.id = parseInt(_ws.id, 10);
      pr = axios.put('/api/workspace', _ws);
    } else {
      create = true;
      pr = axios.post('/api/workspace', _ws);
    }
    pr.then(async (result) => {
      const item = result.data.workspace || result.data.menu;
      if (item) {
        workspace = deserializeWorkspace(item);
        widgets = workspace.widgets;
        reload += 1;
      }
      tableBus.emit('menuUpdated');
      menuBus.emit('menuUpdated');
      if (create && workspace.id) {
        await goto(`/workspace/${workspace.id}`, { replaceState: true, noScroll: true });
      } else {
        await invalidate('app:workspace');
      }
    });
  } catch (e) {
    console.error('Save workspace error:', e);
  }
};

$: {
  const key = `${viewState}:${workspaceId ?? ''}:${initialWorkspace?.id ?? 'default'}`;
  if (key !== loadedKey && viewState !== 'new' && initialWorkspace) {
    loadedKey = key;
    workspace = initialWorkspace;
    widgets = initialWorkspace.widgets || [];
    reload += 1;
  }
}

$: if (status) {
  status.state = viewState === 'new' ? 'new' : viewState === 'entry' ? String(workspaceId ?? '') : '';
}

onMount(() => {
  if (viewState !== 'new') return;
  tick().then(() => {
    const value = get(currentMenu);
    currentMenu.set(null);
    if (value) {
      workspace = value;
      widgets = value.widgets || value.menu || [];
      isEditMode = true;
      reload += 1;
    }
  });
});
</script>
