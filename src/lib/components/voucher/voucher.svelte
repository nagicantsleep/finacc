{#if viewState === 'list'}
<VoucherList
  bind:status={status}
  vouchers={vouchers}
  voucherClasses={voucherClasses}
  dates={dates}
  filters={filters}
  on:open={openEntry}
  on:slip={openSlip}
  on:filter={applyFilters}
></VoucherList>
{:else if (viewState === 'entry' || viewState === 'new') && voucher}
<VoucherEntry
  bind:status={status}
  bind:voucher={voucher}
  voucherClasses={voucherClasses}
  on:open={openSlip}
  on:close={closeEntry}>
</VoucherEntry>
{/if}
{#if popUp}
{#key modalCount}
<CrossSlipModal
  accounts={accounts}
  slip={slip}
  status={status}
  bind:popUp={popUp}
  on:close={updateSlip}></CrossSlipModal>
{/key}
{/if}

<style>
</style>

<script>
import axios from 'axios';
import { afterUpdate } from 'svelte';
import { goto, invalidate } from '$app/navigation';
import VoucherEntry from './voucher-entry.svelte';
import VoucherList from './voucher-list.svelte';
import CrossSlipModal from '../cross-slip/cross-slip-modal.svelte';
import { currentVoucher } from '$lib/client/current-record.js';
import { setAccounts } from '$lib/client/cross-slip.js';
import { link } from '$lib/client/router.js';

let slip = {
  year: 0,
  month: 0,
  lines: []
};
let modalCount = 0;
let popUp;

export let status;
export let vouchers = [];
export let selectedVoucher = null;
export let voucherClasses = [];
export let accounts = [];
export let dates = [];
export let viewState = 'list';
export let filters = {};

let voucher = selectedVoucher;

$: voucher = selectedVoucher;
$: if (status) status.state = viewState;
$: if (accounts?.length) setAccounts(accounts);

const openSlip = (event) => {
  const slipNo = event.detail;
  if (slipNo.no) {
    axios.get(`/api/cross-slip/${slipNo.year}/${slipNo.month}/${slipNo.no}`).then((result) => {
      slip = result.data;
      slip.approvedAt = slip.approvedAt ? new Date(slip.approvedAt) : null;
      popUp = true;
    });
  } else {
    slip = {
      year: parseInt(slipNo.year, 10),
      month: parseInt(slipNo.month, 10),
      day: parseInt(slipNo.day, 10),
      lines: [{
        debitAccount: '',
        debitSubAccount: 0,
        debitAmount: '',
        debitTax: '',
        creditAccount: '',
        creditSubAccount: 0,
        creditAmount: '',
        creditTax: ''
      }]
    };
    popUp = true;
  }
};

const openEntry = (event) => {
  const row = event.detail;
  if (!row || !row.id) {
    link('/voucher/new');
  } else {
    currentVoucher.set(row);
    link(`/voucher/entry/${row.id}`);
  }
};

const updateSlip = () => {
  invalidate('app:voucher');
};

const filterQuery = () => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters || {})) {
    if (value != null && value !== '' && String(value) !== '-1') {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : '';
};

const closeEntry = () => {
  currentVoucher.set(null);
  goto(`/voucher${filterQuery()}`);
};

const applyFilters = (event) => {
  const patch = event.detail || {};
  const params = new URLSearchParams();
  const merged = { ...filters, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (value == null || value === '' || String(value) === '-1') continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  goto(query ? `/voucher?${query}` : '/voucher', { keepFocus: true, noScroll: true });
};

afterUpdate(() => {
  if (!popUp) {
    modalCount += 1;
  }
});
</script>
