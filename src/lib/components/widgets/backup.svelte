<div class="menu">
  <div class="header">
    <button class="btn btn-primary" on:click|preventDefault={backup}>
      <BilingualText key="backup" stacked={false} />
    </button>
  </div>
  <div class="body">
    <div class="table-responsive">
      <table class="table table-bordered table-sm mb-0">
        <thead class="table-light">
          <tr>
          <th scope="col"><BilingualText key="retrieved_at" stacked={false} /></th>
          <th scope="col" style="min-width: 8rem;"><BilingualText key="process" stacked={false} /></th>
          </tr>
        </thead>
        <tbody>
          {#each files as file, i}
          <tr>
            <td style="vertical-align:middle;">
              {fileName(file)}
            </td>
            <td class="text-center">
              {#if (i == 0) }
              <button class="btn btn-success btn-sm" on:click|preventDefault={() => restore(i)}>
                <BilingualText key="restore" stacked={false} />
              </button>
              {:else}
              <button class="btn btn-warning btn-sm" on:click|preventDefault={() => restore(i)}>
                <BilingualText key="restore" stacked={false} />
              </button>
              {/if}
              <button class="btn btn-danger btn-sm" on:click|preventDefault={() => remove(i)}>
                <BilingualText key="delete" stacked={false} />
              </button>
            </td>
          </tr>
          {/each}
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
import {onMount, beforeUpdate} from 'svelte';
import OkModal from '$lib/components/common/OkModal.svelte';
import BilingualText from '$lib/components/BilingualText.svelte';
import { _b } from '$lib/i18n/bilingual.js';

export let toast;
export let status;
export let options = {};

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
  if  ( ev.detail ) {
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
  if  ( ev.detail ) {
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
const mapBackupDates = (dates) => dates.map((m) => new Date(m));

const loadBackupFiles = () => {
  axios.get('/api/admin/backups').then((result) => {
    files = mapBackupDates(result.data);
  });
};

beforeUpdate(()=> {
  if  ( !files?.length && !options.backupDates?.length )  {
    loadBackupFiles();
  }
})

onMount(()=> {
  if (options.backupDates?.length) {
    files = mapBackupDates(options.backupDates);
    return;
  }
  loadBackupFiles();
})

</script>
