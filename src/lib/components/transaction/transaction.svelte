{#if viewState === 'list'}
  <TransactionList
    transactions={transactions}
    transactionKinds={transactionKinds}
    filters={filters}
    on:filter={applyFilters}
  ></TransactionList>
{:else if (viewState === 'entry' || viewState === 'new') && transaction}
  {#await import('./transaction-entry.svelte') then { default: TransactionEntry }}
    <TransactionEntry
      bind:status={status}
      bind:toast={toast}
      bind:transaction={transaction}
      users={users}
      on:close={closeEntry}
    ></TransactionEntry>
  {/await}
{/if}
<script>
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import TransactionList from './transaction-list.svelte';
import { currentTransaction, currentTask } from '$lib/client/current-record.js';
import { link } from '$lib/client/router.js';

export let status;
export let toast;
export let transactions = [];
export let selectedTransaction = null;
export let transactionKinds = [];
export let users = [];
export let viewState = 'list';
export let filters = {};

let transaction = selectedTransaction;

$: transaction = mergeTaskIntoNew(selectedTransaction, viewState);
$: if (status) status.state = viewState;

function mergeTaskIntoNew(base, state) {
  if (state !== 'new' || !base) return base;
  const task = get(currentTask);
  if (!task) return base;
  return {
    ...base,
    taskId: task.id,
    companyId: task.companyId,
    companyName: task.companyName,
    chargeName: task.chargeName,
    zip: task.zip,
    address1: task.address1,
    address2: task.address2,
    subject: task.subject,
    lines: task.lines ? [...task.lines] : base.lines,
    taxClass: task.taxClass,
    tax: task.tax,
    amount: task.amount,
    handledBy: task.handledBy
  };
}

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
  currentTransaction.set(null);
  const task = get(currentTask);
  if (task?.id) {
    link(`/task/entry/${task.id}`);
  } else {
    goto(`/transaction${filterQuery()}`);
  }
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
  goto(query ? `/transaction?${query}` : '/transaction', { keepFocus: true, noScroll: true });
};
</script>
