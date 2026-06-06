<input type="hidden" id="id" value={item.id}>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="container-fluid">
  <div class="row">
    <label for="itemClass" class="col-1 col-form-label"><BilingualText key="kind" /></label>
    <div class="col-3">
      <select class="form-select" id="itemClass"
      	bind:value={item.itemClassId}>
        <option value="-1"><BilingualText key="not_set" /></option>
        {#each itemClasses as line}
        <option value="{line.id}">{line.name}</option>
        {/each}
      </select>
    </div>
  </div>
  <div class="row mt-3">
    <label for="name" class="col-1 col-form-label"><BilingualText key="name" /></label>
    <div class="col-11">
      <input type="text" class="form-control" id="name"
      	bind:value={item.name}>
    </div>
  </div>
  <div class="row mt-3">
    <label for="normalName" class="col-1 col-form-label"><BilingualText key="formal_name_alt" /></label>
    <div class="col-11">
      <input type="text" class="form-control" id="normalName"
      	bind:value={item.normalName}>
    </div>
  </div>
  <div class="row mt-3">
    <label for="key" class="col-1 col-form-label"><BilingualText key="call_key" /></label>
    <div class="col-3">
      <input type="text" class="form-control" id="key"
      	bind:value={item.key}>
    </div>
  </div>
  <div class="row mt-3">
    <label for="" class="col-1 col-form-label"><BilingualText key="code" /></label>
    <div class="col-3">
      <label for="globalCode" class="col-form-label"><BilingualText key="public_code" /></label>
      <input type="text" class="form-control" id="globalCode"
      	bind:value={item.globalCode}>
    </div>
    <div class="col-3">
      <label for="strageCode" class="col-form-label"><BilingualText key="warehouse_code" /></label>
      <input type="text" class="form-control" id="storageCode"
      	bind:value={item.storateCode}>
    </div>
    <div class="col-3">
      <label for="strageCode" class="col-form-label"><BilingualText key="internal_code" /></label>
      <input type="text" class="form-control" id="localCode"
      	bind:value={item.localCode}>
    </div>
  </div>

  <div class="row mt-3">
    <label for="spec" class="col-1 col-form-label"><BilingualText key="specification" /></label>
    <div class="col-10">
      <input type="text" class="form-control" id="spec"
      	bind:value={item.spec}>
    </div>
  </div>
  <div class="row mt-3">
    <label for="unit" class="col-1 col-form-label"><BilingualText key="unit" /></label>
    <div class="col-3">
      <input type="text" class="form-control" id="unit"
      	bind:value={item.unit}>
    </div>
  </div>
  <div class="row mt-3">
    <label for="unit_price" class="col-1 col-form-label"><BilingualText key="unit_price" /></label>
    <div class="col-2">
      <label for="standardPrice" class="col-form-label"><BilingualText key="standard_price" /></label>
      <input type="text" class="form-control number" id="globalCode"
      	bind:value={item.standardPrice}>
    </div>
    <div class="col-2">
      <label for="costPrice" class="col-form-label"><BilingualText key="cost_price" /></label>
      <input type="text" class="form-control number" id="costPrice"
      	bind:value={item.costPrice}>
    </div>
    <div class="col-2">
      <label for="taxClass" class="col-form-label"><BilingualText key="tax" /></label>
      <select class="form-control" id="taxClass"
          bind:value={item.taxClass}>
        {#each TAX_CLASS as ent}
        <option value={ent[1]}>{ent[0]}</option>
        {/each}
      </select>
    </div>
  </div>
  <div class="row mt-3">
    <div class="col-1">
      <label for="description" class="col-form-label"><BilingualText key="description" /></label>
      {#if ( documentEditting )}
      <a href="#" on:click|preventDefault={() => {
        documentEditting = false
      }}>
        <i class="bi bi-check"></i>
      </a>
      {:else}
      <a href="#" on:click|preventDefault={() => {
        documentEditting = true;
        viewDescription = true;
        viewFiles = true;
      }}>
        <i class="bi bi-pencil"></i>
      </a>
      {#if ( viewDescription )}
      <a href="#" on:click|preventDefault={() => {
	      viewDescription = false;
  	  }}>
    	  <i class="bi bi-arrows-collapse"></i>
      </a>
      {:else}
      <a href="#" on:click|preventDefault={() => {
        viewDescription = true;
      }}>
        <i class="bi bi-arrows-expand"></i>
      </a>
      {/if}
      {/if}
  	</div>
    <div class="col-11">
      <Document
        editting={documentEditting}
        {viewDescription}
        noTitle=true
        bind:document={item.document}></Document>
    </div>
  </div>
  <div class="row mt-3">
    <div class="col-1">
      <BilingualText key="file" />
      {#if ( viewFiles )}
      <a href="#" on:click|preventDefault={() => {
        viewFiles = false;
      }}>
        <i class="bi bi-arrows-collapse"></i>
      </a>
      {:else}
      <a href="#" on:click|preventDefault={() => {
        viewFiles = true;
      }}>
        <i class="bi bi-arrows-expand"></i>
      </a>
      {/if}
    </div>
    <div class="col-11">
      {#if ( viewFiles )}
      <DocumentFiles
      	document={item.document}
        bind:files={files}></DocumentFiles>
      {/if}
    </div>
  </div>
</div>
<style>
</style>

<script>
import axios from 'axios';
import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
import {TAX_CLASS} from '../../../libs/utils.js';
import Document from '../components/document.svelte';
import DocumentFiles from '../components/document-files.svelte';

import BilingualText from '../components/bilingual-text.svelte';
export	let	status;
export let item;
export  let	files;

let documentEditting = false;
let viewDescription = false;
let viewFiles = false;

let itemClasses = [];

onMount(() => {
  console.log('item-info onMount', status);
  axios.get('/api/item/classes').then((result) => {
    console.log(result);
    itemClasses = result.data.values;
  })
})

</script>
