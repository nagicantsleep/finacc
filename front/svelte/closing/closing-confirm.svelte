<div class="list">
  <div class="page-title">
    <h1 class="page-title-bilingual"><BilingualText key="year_end_process" inline={true} /> — {term}{$bi('period_suffix')}</h1>
  </div>

  <div class="alert alert-warning" role="alert">
    <strong>操作は取り消せません / Hành động không thể hoàn tác</strong>
  </div>

  {#if loadError}
    <div class="alert alert-danger">{loadError}</div>
  {:else if data}
    <ul class="list-group mb-3">
      <li class="list-group-item d-flex justify-content-between">
        <span><BilingualText key="all_slips_approved" inline={true} /></span>
        <span>{data.checklist.allApproved ? '✅' : `❌ (${data.unapprovedCount})`}</span>
      </li>
      <li class="list-group-item d-flex justify-content-between">
        <span><BilingualText key="debit_equals_credit" inline={true} /></span>
        <span>{data.totals.balanced ? '✅' : `❌ (D ${data.totals.debit.toLocaleString()} / C ${data.totals.credit.toLocaleString()})`}</span>
      </li>
      <li class="list-group-item d-flex justify-content-between">
        <span><BilingualText key="next_fiscal_year_empty" inline={true} /></span>
        <span>{data.checklist.nextFyEmptyOrAbsent ? '✅' : '⚠️'}</span>
      </li>
    </ul>

    {#if data.plPrecheck.hasNonZeroPL}
      <div class="alert alert-danger" role="alert">
        <strong>⚠️ 次期に既に損益勘定残高があります。決算時にリセットされます。</strong>
        <br/>Kỳ kế tiếp đã có số dư PL — sẽ bị reset khi đóng sổ.
        <ul class="mt-2 mb-2">
          {#each data.plPrecheck.accounts as a}
            <li>{a.code} {a.name} — D {a.debit.toLocaleString()} / C {a.credit.toLocaleString()}</li>
          {/each}
        </ul>
        <label class="form-check-label">
          <input type="checkbox" class="form-check-input" bind:checked={plResetAcknowledged} />
          理解し、続行します / Tôi đã hiểu và muốn tiếp tục
        </label>
      </div>
    {/if}

    {#if !isAdmin}
      <div class="alert alert-secondary"><BilingualText key="admin_only_action" inline={true} /></div>
    {/if}

    {#if submitError}
      <div class="alert alert-danger">{submitError}</div>
    {/if}

    <button type="button" class="btn btn-danger"
      disabled={!canClose}
      on:click={runClosing}>
      <BilingualText key="carry_forward" inline={true} />
    </button>
    <a class="btn btn-outline-secondary ms-2" href="/home/{term}"><BilingualText key="cancel" inline={true} /></a>
  {:else}
    <div>Loading…</div>
  {/if}
</div>

<script>
import axios from 'axios';
import { onMount } from 'svelte';
import BilingualText from '../components/bilingual-text.svelte';
import { bi } from '../../javascripts/bilingual.js';
import { currentPage, link } from '../../javascripts/router.js';

export let status;

let term;
let data = null;
let loadError = null;
let submitError = null;
let plResetAcknowledged = false;
let submitting = false;

$: isAdmin = !!(status && status.user && status.user.administrable);
$: canClose = !!data
  && isAdmin
  && !submitting
  && (!data.plPrecheck.hasNonZeroPL || plResetAcknowledged);

const parseTerm = (page) => {
  // /closing/<term>/confirm  or  /closing/<term>
  const parts = (page || '').split('?')[0].split('/');
  return parseInt(parts[2]);
};

const loadData = async () => {
  loadError = null;
  try {
    const res = await axios.get(`/api/closing/${term}/confirm`);
    data = res.data;
  } catch (e) {
    loadError = e.response?.data?.message || 'Failed to load closing checklist.';
  }
};

const runClosing = async () => {
  submitError = null;
  submitting = true;
  try {
    const res = await axios.post(`/api/closing/${term}`, { plResetAcknowledged });
    if (res.data && res.data.code === 0) {
      link(`/trial-balance?closed=${term}`);
    } else {
      submitError = res.data?.message || 'Closing failed.';
    }
  } catch (e) {
    submitError = e.response?.data?.message || 'Closing failed.';
  } finally {
    submitting = false;
  }
};

onMount(() => {
  term = parseTerm(getCurrentPage());
  loadData();
});

function getCurrentPage() {
  let v;
  const unsub = currentPage.subscribe((x) => { v = x; });
  unsub();
  return v;
}
</script>
