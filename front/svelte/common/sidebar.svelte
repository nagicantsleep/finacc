<div class="sidebar">
	<nav class="mt-2">
    <ul class="nav nav-pills nav-sidebar flex-column">
      <li class="nav-item">
        <div class="d-flex align-items-center justify-content-between" style="width:240px;">
          <!-- svelte-ignore a11y-missing-attribute -->
          <a class="nav-link">
						<i class="bi bi-menu-button-wide me-1"></i>
            <BilingualText key="menu" />
          </a>
          {#if ( isMenuEditMode)}
          <div>
          <button class="btn btn-narrow dropdown-toggle"
          	type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <Icon icon="bi:plus" class="text-warning"></Icon>
          </button>
          <ul class="dropdown-menu">
            {#each menuTemplates as template}
            <button class="dropdown-item"
            	on:click|preventDefault={() => {
                newMenu(template);
              }}
              >
              {template.title}
            </button>
            {/each}
          </ul>

          <button type="button" class="btn btn-narrow" on:click={menuEditDone}>
            <Icon icon="bi:check" class="text-warning"></Icon></button>
          </div>
          {:else}
          <button type="button" class="btn btn-narrow" on:click={() => {
            isMenuEditMode = true;
          }}><Icon icon="bi:pencil" class="text-warning"></Icon></button>
          {/if}
        </div>
        <ul class="nav nav-pills nav-sidebar flex-column"
        	style="margin-left:20px;list-style: none;"
        	bind:this={menuItems}>
          {#each menuEntries as entry, i (entry)}
          <li class="nav-item" data-id={i}>
            <div class="d-flex align-items-center justify-content-between" style="width:230px;">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <!-- svelte-ignore a11y-missing-attribute -->
            <a class={ ( args[1] === 'menu' && args[2] == entry.id ) ? 'nav-link active': 'nav-link'}
            	style="cursor:pointer;"
              on:click|preventDefault={() => {
                link(`/menu/${entry.id}`);
              }}>
              <Icon class="nav-icon{ isMenuEditMode ? ' drag-handle' : ''}"
                icon="bi:circle"></Icon>
							{entry.title}
            </a>
            {#if isMenuEditMode}
            <button type="button" class="btn btn-narrow"
            	on:click={() => {
                deleteMenu(entry);
              }}>
              <Icon icon="bi:x" class="text-warning"></Icon>
            </button>
            {/if}
            </div>
          </li>
          {/each}
        </ul>
      </li>
		</ul>
  </nav>
  <nav class="mt-2">
    <ul class="nav nav-pills nav-sidebar flex-column">
      {#each menu as entry}
      {#if ( entry.title && ( !entry.authority || entry.authority(status.user, status.company) )) }
		<li class="nav-item">
		  <a class={ $currentPage && $currentPage.match(entry.match) ? 'nav-link active': 'nav-link'}
        draggable="true"
        data-type={entry.name}
        on:dragstart={startDrag}
        on:click|preventDefault={() => {
          link(entry.href(status));
        }}
        href="#">
        <span class="sidebar-row">
          <span class="sidebar-row__icon">
        {#if ( entry.icon )}
        {#if ( entry.icon.name)}
        <Icon class="nav-icon me-1" icon={entry.icon.name}></Icon>
        {:else}
        <img src={entry.icon.src} class="icon-img">
        {/if}
        {:else}
        <Icon class="nav-icon" icon="bi:circle"></Icon>
        {/if}
          </span>
          <span class="sidebar-row__text">
        {#if MODULE_I18N[entry.name]}
          <BilingualText key={MODULE_I18N[entry.name]} />
        {:else}
          {entry.title}
        {/if}
          </span>
        </span>
      </a>
      {#if ( entry.submenu && ( status.pathname.match(entry.match) ) )}
      <ul>
        {#each entry.submenu as subentry}
        <li class="nav-item">
          <a class={ $currentPage && $currentPage.match(subentry.match) ? 'nav-link active': 'nav-link'}
            draggable="true"
            data-type={entry.name}
            on:dragstart={startDrag}
            on:click|preventDefault={() => {
              link(subentry.href(status));
            }}
            href="#">
            <span class="sidebar-row">
              <span class="sidebar-row__icon">
            {#if subentry.icon}
            {#if ( subentry.icon.name)}
            <Icon class="nav-icon" icon={subentry.icon.name}></Icon>
            {:else}
            <img src={subentry.icon.src} class="icon-img">
            {/if}
            {:else}
            <Icon class="nav-icon" icon="fa6-solid:circle"></Icon>
            {/if}
              </span>
              <span class="sidebar-row__text">
            {#if SUBMENU_I18N[subentry.title]}
              <BilingualText key={SUBMENU_I18N[subentry.title]} />
            {:else}
              {subentry.title}
            {/if}
              </span>
            </span>
          </a>
        </li>
        {/each}
      </ul>
      {/if}
		</li>
      {/if}
      {/each}
    </ul>
  </nav>
</div>


<style>
.icon {
  margin-right: 0.5rem;
}

/* Sidebar row layout: 1 row, 2 columns.
   Col 1: icon. Col 2: 2 stacked lines (BilingualText renders primary on top,
   secondary below). Both columns are vertically centered. */
.sidebar-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
}
.sidebar-row__icon {
  flex: 0 0 auto;
  display: inline-flex;
}
.sidebar-row__text {
  flex: 1 1 auto;
  min-width: 0;
  display: inline-flex;
}
</style>
<script>
import axios from 'axios';
import {onMount, afterUpdate, createEventDispatcher, tick} from 'svelte';
import menu from '../../../config/module-list.js';
import Sortable from 'sortablejs';
import Icon from '@iconify/svelte';
import BilingualText from '../components/bilingual-text.svelte';
import { bi } from '../../javascripts/bilingual.js';
import eventBus from '../../javascripts/event-bus.js';
import {currentMenu, getStore} from '../../javascripts/current-record.js'
import { currentPage, link } from '../../javascripts/router.js';

export	let status;
export let mainCount;

let menuItems;
let isMenuEditMode = false;
let menuTemplates = [];

// Map config/module-list.js entry.name -> i18n key for the menu title.
// Falls back to entry.title (hardcoded JA) if the name has no mapping.
const MODULE_I18N = {
  'menu': 'menu',
  'journal': 'journal',
  'ledger': 'ledger',
  'bank-ledger': 'bank_ledger',
  'trial-balance': 'trial_balance',
  'reports/trial-balance': 'trial_balance_v2',
  'changes': 'changes',
  'voucher': 'voucher_info',
  'accounts': 'account_management2',
  'company': 'company_management',
  'project': 'project_management',
  'task': 'task_management',
  'transaction': 'transaction_document',
  'item': 'item_management',
  'member': 'member_management',
  'home': 'home',
  'closing': 'closing',
  'simulation': 'simulation'
};

// Map submenu hardcoded JA title -> i18n key
const SUBMENU_I18N = {
  '設定': 'settings',
  '集計用ラベル管理': 'label_management',
  'プロジェクト集計': 'project_summary',
  '品目管理': 'item_management',
  '取引先管理': 'company_management',
  'プロジェクト管理': 'project_management'
};

const newMenu = (template) => {
  currentMenu.set({
    title: template.title,
    displayOrder: 99,
    widgets: JSON.parse(template.body)
  });
	link('/menu/new');
}

let deleteEntry;
const deleteMenu = (entry) => {
  deleteEntry = entry;
  eventBus.emit('okModal', {
    title: $bi('menu_delete'),
    description: `メニュー「${entry.title}」` + $bi('menu_delete_confirm'),
    reply: 'deleteMenu'
  });
}
const menuEditDone = (event) => {
  for ( let i = 0; i < menuEntries.length ; i += 1 )  {
    menuEntries[i].displayOrder = i + 1;
  }
  axios.put('/api/menu', {
    menus: menuEntries
  }).then((result) => {
    isMenuEditMode = false;
    console.log('done');
  });
}
onMount(async () => {
  let result = await axios.get('/api/menu');
  menuEntries = result.data.menus;
  axios.get('/api/menu/templates').then((result) => {
    menuTemplates = result.data.templates;
  })
  eventBus.on('menuUpdated', () => {
    console.log('sidebar menuUpdated');
    axios.get('/api/menu').then((result) => {
    	menuEntries = result.data.menus;
  	})
  });
  eventBus.once('deleteMenu', (ok) => {
    if  ( ok )  {
      axios.delete(`/api/menu/${deleteEntry.id}`).then(() => {
    	  axios.get('/api/menu').then((result) => {
    		  menuEntries = result.data.menus;
  		  })
  	  });
    }
  })
  const sortable = new Sortable(menuItems, {
    animation: 150,
    handle: ".drag-handle",
    fallbackOnBody: true,
    removeCloneOnHide: true,
    onEnd: (evt) => {
      let { oldIndex, newIndex } = evt;

      if (oldIndex !== newIndex) {
        const moved = menuEntries[oldIndex];
        menuEntries.splice(oldIndex, 1);
        menuEntries.splice(newIndex, 0, moved);
        menuEntries = [...menuEntries];
      }
    }
  });
  console.log({sortable})
});

let menuEntries = [];

let args = [];
$: if ($currentPage) {
  args = $currentPage.split('/');
}

const startDrag = (event) => {
  let name = event.target.dataset.type;
  //console.log('dragData', name);
  event.dataTransfer.setData("application/json", JSON.stringify({
    name: name,
    component: 'MenuLink'
  }));
  event.dataTransfer.effectAllowed = "copy";
};

</script>
