<div class="card">
  <div class="card-header">
    <h5 class="card-title"><BilingualText key="backup" /></h5>
  </div>
  <div class="card-body">
    <button class="btn btn-primary" on:click|preventDefault={backup}><BilingualText key="create_backup" /></button>
    <button class="btn btn-info" on:click|preventDefault={upload}><BilingualText key="upload" /></button>
    <input type="file" class="d-none" id="backup-file" on:change={doUpload} />
    <div class="row h-100" style="margin-top: 20px;">
      <table class="table table-bordered">
        <thead class="table-light">
          <th><BilingualText key="retrieved_at" /></th>
          <th><BilingualText key="process" /></th>
        </thead>
        <tbody>
          {#if files}
          {#each files as file, i}
          <tr>
            <td style="vertical-align:middle;font-size:12pt;">
              {fileName(file)}
            </td>
            <td style="text-align:center;">
              {#if (i == 0) }
              <btton class="btn btn-success" on:click|preventDefault={() => restore(i)}><BilingualText key="restore" /></btton>
              {:else}
              <btton class="btn btn-warning" on:click|preventDefault={() => restore(i)}><BilingualText key="restore" /></btton>
              {/if}
              <btton class="btn btn-danger" on:click|preventDefault={() => remove(i)}><BilingualText key="delete" /></btton>
              <btton class="btn btn-info" on:click|preventDefault={() => download(i)}><BilingualText key="download" /></btton>
            </td>
          </tr>
          {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
<OkModal
  bind:this={modal}
  title={title}
  description={description}
  on:answer={operation}
  ></OkModal>


<script>
import axios from 'axios';
import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
import {get} from 'svelte/store';
import {bi, languagePair} from '../../javascripts/bilingual.js';
import jaDict from '../../javascripts/locales/ja.json';
import viDict from '../../javascripts/locales/vi.json';

import OkModal from '../common/ok-modal.svelte';

import BilingualText from '../components/bilingual-text.svelte';
export let toast;

let files;
let modal;
let description;
let title;
let operation;
let restoreFile;
let removeFile;

const DICT = { ja: jaDict, vi: viDict };
const fileName = (file) => {
  const pair = get(languagePair);
  const dict = DICT[pair.primary] || jaDict;
  const y = dict['year'] || jaDict['year'];
  const m = dict['month'] || jaDict['month'];
  const d = dict['day'] || jaDict['day'];
  return `${file.getFullYear()}${y}${file.getMonth()+1}${m}${file.getDate()}${d} ${file.toLocaleTimeString()}`
}

const download = (i) => {
  const file = files[i];
  const url = `/api/admin/backup/${file.toJSON()}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = file.toJSON();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const upload = () => {
  const uploader = document.getElementById('backup-file');
  uploader.click();
}

const doUpload = (ev) => {
  const file = ev.target.files[0];
  if  ( !file ) {
    return;
  }
  const formData = new FormData();
  formData.append('file', file);
  axios.post('/api/admin/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(() => {
    toast.show($bi('backup'), $bi('backup_upload_complete'));
    files = undefined;
  });
}

const remove = (i) => {
  console.log('remove');
  removeFile = files[i];
  if  ( i > 0 ) {
    description = `${fileName(removeFile)}${$bi('taken_on')}<br />${i}${$bi('gen_backup_before')}`;
  } else {
    description = `${fileName(removeFile)}${$bi('taken_on')}<br />${$bi('backup_delete_simple')}`;
  }
  title = $bi('backup_delete_title');
  operation = doRemove;
  modal.show();
}
const restore = (i) => {
  console.log('restore');
  restoreFile = files[i];
  if  ( i > 0 ) {
    description = `${fileName(restoreFile)}${$bi('taken_on')}<br />${i}${$bi('gen_backup_restore_before')}`;
  } else {
    description = `${fileName(restoreFile)}${$bi('taken_on')}<br />${$bi('backup_restore_simple')}`;
  }
  title = $bi('backup_restore_title');
  operation = doRestore;
  modal.show();
}
const doRestore = (ev) => {
  console.log(ev.detail);
  if  ( ev.detail ) {
    console.log('Yes');
    toast.show($bi('backup'), $bi('restore_started'));
    axios.post('/api/admin/restore', {
      date: restoreFile
    }).then((result) => {
      let data = result.data;
      if  ( data.code === 0 ) {
        window.location = '/home';
        toast.remove();
        toast.show($bi('backup'), $bi('restore_completed'));
      }
    })
  }
}
const doRemove = (ev) => {
console.log(ev.detail);
  if  ( ev.detail ) {
    axios.delete(`/api/admin/backup/${removeFile.toJSON()}`).then(() => {
      toast.show($bi('backup'), $bi('backup_deleted_msg'))
      files = undefined;
    })
  }
}

const backup = () => {
  toast.show($bi('backup'), $bi('backup_started'))
  axios.post('/api/admin/backup').then(() => {
    toast.remove();
    toast.show($bi('backup'), $bi('backup_ended'));
    files = undefined;
  })
}

beforeUpdate(()=> {
  if  ( !files )  {
    axios.get('/api/admin/backups').then((result) => {
      files = [];
      for ( let m of result.data )  {
        files.push(new Date(m));
      }
      files = files;
    })
  }
})

</script>