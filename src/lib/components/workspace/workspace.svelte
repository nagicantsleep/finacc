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
import { onMount, beforeUpdate, tick } from "svelte";
import { currentMenu, getStore } from '$lib/client/current-record.js';
import { numeric, formatDate } from '$lib/utils.js';
import { eventBus as tableBus } from '$lib/client/table-maintenance.js';
import menuBus from '$lib/client/event-bus.js';
import { componentList } from '$lib/client/widget-list.js';
import BilingualText from '$lib/components/BilingualText.svelte';

export let status;
export let toast;

let workspace = { title: '', widgets: [] };
let widgets = [];
let arg2;
let reload = 0;
let isEditMode = false;

const startWidgetDrag = (event) => {
  let name = event.target.dataset.type;
  event.dataTransfer.setData("application/json", JSON.stringify({
    component: name
  }));
  event.dataTransfer.effectAllowed = "copy";
};

const serializeWorkspace = () => {
  return ({
    id: workspace.id,
    title: workspace.title,
    displayOrder: workspace.displayOrder,
    body: JSON.stringify(widgets)
  });
};

const deserializeWorkspace = (_ws) => {
  if (!_ws) return { title: '', widgets: [] };
  let parsedWidgets = [];
  try {
    parsedWidgets = typeof _ws.body === 'string' ? JSON.parse(_ws.body) : (_ws.widgets || []);
  } catch (e) {
    parsedWidgets = [];
  }
  return ({
    id: _ws.id,
    title: _ws.title,
    displayOrder: _ws.displayOrder,
    widgets: parsedWidgets
  });
};

const save = (event) => {
  try {
    let pr;
    let create = false;
    let _ws = serializeWorkspace();
    if (_ws.id) {
      _ws.id = parseInt(_ws.id);
      pr = axios.put('/api/workspace', _ws);
    } else {
      create = true;
      pr = axios.post('/api/workspace', _ws);
    }
    pr.then((result) => {
      const item = result.data.workspace || result.data.menu;
      if (item) {
        workspace = deserializeWorkspace(item);
        widgets = workspace.widgets;
        reload += 1;
      }
      tableBus.emit('menuUpdated');
      menuBus.emit('menuUpdated');
      if (create && workspace.id) {
        window.history.replaceState(status, "", `/workspace/${workspace.id}`);
      }
    });
  } catch (e) {
    console.error('Save workspace error:', e);
  }
};

$: {
  let args = (typeof location !== 'undefined' ? location.pathname : '').split('/');
  if (args[2] === 'new') {
    status.state = args[2];
    tick().then(() => {
      let value = $currentMenu;
      currentMenu.set(null);
      if (value) {
        workspace = value;
        widgets = value.widgets || [];
        isEditMode = true;
        reload += 1;
      }
    });
  } else if (numeric(args[2])) {
    if (arg2 !== args[2]) {
      arg2 = args[2];
      widgets = [];
      axios.get(`/api/workspace/${args[2]}`).then((result) => {
        const item = result.data.workspace || result.data.menu;
        workspace = deserializeWorkspace(item);
        widgets = workspace.widgets;
        reload += 1;
      });
    }
  }
}

beforeUpdate(() => {
  let args = (typeof location !== 'undefined' ? location.pathname : '').split('/');
  if (numeric(args[2])) {
    if (arg2 !== args[2]) {
      arg2 = args[2];
      widgets = [];
      axios.get(`/api/workspace/${args[2]}`).then((result) => {
        const item = result.data.workspace || result.data.menu;
        workspace = deserializeWorkspace(item);
        widgets = workspace.widgets;
        reload += 1;
      });
    }
  }
});

onMount(() => {
  let args = (typeof location !== 'undefined' ? location.pathname : '').split('/');
  if (!args[2] || args[2] === '') {
    axios.get('/api/workspace').then((result) => {
      const list = result.data.workspaces || result.data.menus || [];
      if (list.length > 0) {
        workspace = deserializeWorkspace(list[0]);
        widgets = workspace.widgets || [];
        reload += 1;
      } else {
        workspace = { title: 'Workspace', widgets: [] };
        widgets = [];
      }
    });
  }
});
</script>
