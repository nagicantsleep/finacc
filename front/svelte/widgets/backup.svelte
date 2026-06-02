<div class="menu">
  <div class="header">
    <button class="btn btn-primary" on:click|preventDefault={backup}>
      <BilingualText key="backup" />
    </button>
  </div>
  <div class="body">
    <table class="table table-bordered">
      <thead class="table-light">
        <th><BilingualText key="retrieved_at" /></th>
        <th><BilingualText key="process" /></th>
      </thead>
      <tbody>
        {#each files as file, i}
        <tr>
          <td style="vertical-align:middle;font-size:12pt;">
            {fileName(file)}
          </td>
          <td style="text-align:center;">
            {#if (i == 0) }
            <button class="btn btn-success" on:click|preventDefault={() => restore(i)}>
              <BilingualText key="restore" />
            </button>
            {:else}
            <button class="btn btn-warning" on:click|preventDefault={() => restore(i)}>
              <BilingualText key="restore" />
            </button>
            {/if}
            <button class="btn btn-danger" on:click|preventDefault={() => remove(i)}>
              <BilingualText key="delete" />
            </button>
          </td>
        </tr>
        {/each}
      </tbody>
    </table>
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
import {onMount, beforeUpdate} from 'svelte';
import eventBus from '../../javascripts/event-bus.js';
import OkModal from '../common/ok-modal.svelte';
import BilingualText from '../components/bilingual-text.svelte';
import { _b } from '../../javascripts/bilingual.js';

export let toast;
export let status;

let files = [];
let modal;
let description;
let title;
let operation;
let restoreFile;
let removeFile;

const fileName = (file) => {
  return  `${file.getFullYear()}${_b('year_num').primary}${file.getMonth()+1}${_b('month_num').primary}${file.getDate()}${_b('day').primary}${file.toLocaleTimeString()}`
}

const remove = (i) => {
  console.log('remove');
  removeFile = files[i];
  const takenOn = _b('taken_on');
  const tStr = `${takenOn.primary} / ${takenOn.secondary}`;
  if  ( i > 0 ) {
    const genBefore = _b('gen_backup_before');
    const gbStr = `${genBefore.primary} / ${genBefore.secondary}`;
    description = `${fileName(removeFile)}${tStr}<br />${i}${gbStr}`;
  } else {
    const bDelSimple = _b('backup_delete_simple');
    const bdsStr = `${bDelSimple.primary} / ${bDelSimple.secondary}`;
    description = `${fileName(removeFile)}${tStr}<br />${bdsStr}`;
  }
  const _bResult = _b('backup_delete_title');
  title = `${_bResult.primary} / ${_bResult.secondary}`;
  operation = doRemove;
  modal.show();
}
const restore = (i) => {
  console.log('restore');
  restoreFile = files[i];
  const takenOn = _b('taken_on');
  const tStr = `${takenOn.primary} / ${takenOn.secondary}`;
  if  ( i > 0 ) {
    const genRestoreBefore = _b('gen_backup_restore_before');
    const grbStr = `${genRestoreBefore.primary} / ${genRestoreBefore.secondary}`;
    description = `${fileName(restoreFile)}${tStr}<br />${i}${grbStr}`;
  } else {
    const bRestoreSimple = _b('backup_restore_simple');
    const brsStr = `${bRestoreSimple.primary} / ${bRestoreSimple.secondary}`;
    description = `${fileName(restoreFile)}${tStr}<br />${brsStr}`;
  }
  const _bResult2 = _b('backup_restore_title');
  title = `${_bResult2.primary} / ${_bResult2.secondary}`;
  operation = doRestore;
  modal.show();
}
const doRestore = (ev) => {
  console.log(ev.detail);
  if  ( ev.detail ) {
    console.log('Yes');
    const restoreStarted = _b('restore_started');
    toast.show(`${restoreStarted.primary} / ${restoreStarted.secondary}`, '');
    axios.post('/api/admin/restore', {
      date: restoreFile
    }).then((result) => {
      let data = result.data;
      if  ( data.code === 0 ) {
        window.location = '/home';
        toast.remove();
        const restoreCompleted = _b('restore_completed');
        toast.show(`${restoreCompleted.primary} / ${restoreCompleted.secondary}`, '');
      }
    })
  }
}
const doRemove = (ev) => {
  console.log(ev.detail);
  if  ( ev.detail ) {
    console.log('Yes');
    axios.delete(`/api/admin/backup/${removeFile.toJSON()}`).then(() => {
      const backupDeleted = _b('backup_deleted_msg');
      toast.show(`${backupDeleted.primary} / ${backupDeleted.secondary}`, '')
      files = undefined;
    })
  }
}

const backup = () => {
  const backupStarted = _b('backup_started');
  toast.show(`${backupStarted.primary} / ${backupStarted.secondary}`, '')
  axios.post('/api/admin/backup').then(() => {
    toast.remove();
    const backupEnded = _b('backup_ended');
    toast.show(`${backupEnded.primary} / ${backupEnded.secondary}`, '')
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

onMount(()=> {
  axios.get('/api/admin/backups').then((result) => {
    console.log('backup', {result});
    files = [];
    for ( let m of result.data )  {
      files.push(new Date(m));
    }
  })
})

</script>
