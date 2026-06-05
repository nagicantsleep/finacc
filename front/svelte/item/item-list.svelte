<div class="page-title d-flex justify-content-between align-items-center flex-wrap">
  <h1 class="page-title-bilingual mb-0"><BilingualText key="item_list" inline={true} /></h1>
  <button type="button" class="btn btn-primary btn-bilingual flex-shrink-0"
    on:click={() => {
      openItem(null);
    }}
    id="item-info"><BilingualText key="item_entry_space" inline={true} /><i class="bi bi-pencil-square"></i></button>
</div>
<div class="full-height-1 fontsize-12pt">
  <table class="table table-bordered">
    <thead class="table-light">
      <tr>
        <th scope="col" style="width: 150px;"><BilingualText key="class_name" /></th>
        <th scope="col" style="width: 150px;"><BilingualText key="search_key" /></th>
        <th scope="col" style="width: 150px;"><BilingualText key="thumbnail" /></th>
        <th scope="col" style="width: 150px;"><BilingualText key="product_name_public_code" /></th>
        <th scope="col"><BilingualText key="specification" /></th>
        <th scope="col" style="width: 80px;"><BilingualText key="unit" /></th>
        <th scope="col" style="width: 110px;"><BilingualText key="unit_price" /></th>
      </tr>
      <tr>
        <th style="padding:5px;">
          <select class="form-select" id="itemClass"
            on:input={(event) => {
                updateItems({
                  itemClassId: event.currentTarget.value
                });
              }
            }
            bind:value={itemClassId}>
            <option value="-1"><BilingualText key="all" /></option>
            {#each itemClasses as line}
            <option value={line.id}>{line.name}</option>
            {/each}
          </select>
        </th>
        <th style="padding:5px;">
          <input type="text" class="form-control"
            bind:value={key}
            on:input={
              () => {
                updateItems({
                  key: key
                });
              }
            }
          />
        </th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each items as line}
      <tr>
        <td>
          {line.itemClass.name}
        </td>
        <td>
          {line.key}
        </td>
        <td>
          {#if line.document && line.document.files && line.document.files.length > 0 }
          <button type="button" class="btn btn-link"
            on:click={() => {
              openItem(line.id);
            }}>
            <img src="/api/document/file/{line.document.files[0].id}"
              style="width:180px;" alt="thumb">
          </button>
          {/if}
        </td>
        <td>
          <button type="button" class="btn btn-link"
            on:click={() => {
              openItem(line.id);
            }}>
            {line.name || '____'}<br/>
            {line.globalCode || ''}
          </button>
        </td>
        <td>
          {line.spec || ''}
        </td>
        <td>
          {line.unit || ''}
        </td>
        <td class="number">
          {numeric(line.standardPrice).toLocaleString()}<br/>
          {numeric(line.costPrice).toLocaleString()}
        </td>
      </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
.page-title-bilingual {
  display: inline-flex;
  align-items: center;
  line-height: 1.3;
}
.btn-bilingual {
  min-height: 56px;
  line-height: 1.2;
  white-space: normal;
  padding: 0.25rem 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.page-title {
  margin-bottom: 1rem;
}
</style>

<script>
import axios from 'axios';
import {numeric} from '../../../libs/utils.js';
import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
const dispatch = createEventDispatcher();
import {parseParams, buildParam} from '../../javascripts/params.js';
import {link, currentPage, getStore} from '../../javascripts/router.js';

import BilingualText from '../components/bilingual-text.svelte';
export	let	items;
export  let status;

let itemClassId;
let itemClasses = [];
let key = '';

const updateItems = (_params) => {
  let param = buildParam(status, _params);
  axios.get(`/api/item?${param}`).then((result) => {
    items = result.data.items;
  });
  if	( _params )	{
    const page = getStore(currentPage);
    const basePath = page ? page.split('?')[0] : '/item/list';
    link(`${basePath}?${param}`);
  }
};

onMount(() => {
  status.params = parseParams();
  itemClassId = status.params.itemClassId || -1;
  key = status.params.key || '';
  updateItems();
  axios.get('/api/item/classes').then((result) => {
    itemClasses = result.data.values;
  })
})
beforeUpdate(() => {
  //console.log('item-list beforeUpdate');
});

const openItem = (id) => {
  let	item;
  if  ( id )  {
    for ( let i = 0; i < items.length; i ++ ) {
      if ( items[i].id == id ) {
        item = items[i];
        break;
      }
    }
  }
  dispatch('open', item);
}
</script>