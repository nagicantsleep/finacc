<!--
  TrialBalanceDrillDown — Issue #211 (E1.5).

  Modal that opens when the user clicks a `account` or `subAccount` row
  in the trial balance. Loads the corresponding ledger entries from
  /api/ledger/:term/:account[/:subAccount]?from=&to= and shows them in
  a compact table. Phase 1: modal. Phase 2: viewport-wide → side panel.

  Closing on ESC / outside-click uses Bootstrap Modal default backdrop.

  Props (bindable via the parent):
    term          — FiscalYear.term, comes from status.fy.term
    accountCode   — string, e.g. '1000000'
    subCode       — number | null
    accountName   — display name
    from / to     — Date | string, period bounds (default: full FY)

  Methods:
    open() / close()
-->
<div class="modal" bind:this={modalEl} tabindex="-1">
  <div class="modal-dialog modal-xl modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          <BilingualText key="ledger" inline={true} />
          {#if viewCode ?? accountCode}
            <span class="tb-drill-account">
              / {viewCode ?? accountCode}{(viewSub ?? subCode) != null ? '-' + (viewSub ?? subCode) : ''}{(viewName ?? accountName) ? ' ' + (viewName ?? accountName) : ''}
            </span>
          {/if}
        </h5>
        <button type="button" class="btn-close" aria-label="Close"
          on:click={close}></button>
      </div>
      <div class="modal-body">
        {#if loading}
          <p class="text-muted">...</p>
        {:else if errorKey}
          <p class="text-danger"><BilingualText key={errorKey} inline={true} /></p>
        {:else if error}
          <p class="text-danger">{error}</p>
        {:else}
          <div class="tb-drill-meta mb-2">
            <span class="text-muted">
              {formatDate(from)} 〜 {formatDate(to)} · {lines.length} {lines.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          {#if lines.length === 0}
            <p class="text-muted">データなし / Không có dữ liệu</p>
          {:else}
            <table class="table table-bordered table-sm tb-drill-table">
              <thead class="table-light">
                <tr>
                  <th style="width:5rem">日付<br/>Ngày</th>
                  <th style="width:5rem">No.</th>
                  <th>摘要 / Diễn giải</th>
                  <th style="width:8rem">相手科目<br/>T.K đối ứng</th>
                  <th class="tb-col-num" style="width:7rem">借方<br/>Nợ</th>
                  <th class="tb-col-num" style="width:7rem">貸方<br/>Có</th>
                </tr>
              </thead>
              <tbody>
                {#each lines as l (l.year + '-' + l.month + '-' + l.day + '-' + l.no + '-' + l.lineNo)}
                  <tr>
                    <td class="text-center">
                      <button type="button" class="btn btn-link p-0"
                        on:click={() => openJournal(l)}>
                        {l.month}/{l.day}
                      </button>
                    </td>
                    <td class="text-center">{l.no}</td>
                    <td>{l.description || l.application || ''}</td>
                    <td>{counterAccountLabel(l)}</td>
                    <td class="tb-col-num">{formatNum(l.debitAmount)}</td>
                    <td class="tb-col-num">{formatNum(l.creditAmount)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        {/if}
      </div>
      <div class="modal-footer">
        <a class="btn btn-primary"
          href={fullLedgerHref}
          on:click={close}>
          <BilingualText key="open_full_ledger" inline={true} />
          <i class="bi bi-box-arrow-up-right"></i>
        </a>
        <button type="button" class="btn btn-secondary" on:click={close}>
          <BilingualText key="close" inline={true} />
        </button>
      </div>
    </div>
  </div>
</div>

<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import axios from 'axios';
  import Modal from 'bootstrap/js/dist/modal';
  import BilingualText from '../components/bilingual-text.svelte';
  import { link } from '../../javascripts/router.js';

  export let term = null;
  export let accountCode = null;
  export let subCode = null;
  export let accountName = null;
  export let from = null;
  export let to = null;

  const dispatch = createEventDispatcher();

  let modalEl;
  let modal;
  let lines = [];
  let loading = false;
  let error = null;
  let errorKey = null;
  /** Snapshot for the active modal session (avoids prop timing on open()). */
  let viewTerm = null;
  let viewCode = null;
  let viewSub = null;
  let viewName = null;

  export const open = async (overrides = {}) => {
    viewTerm = overrides.term ?? term;
    viewCode = overrides.accountCode ?? accountCode;
    viewSub = overrides.subCode !== undefined ? overrides.subCode : subCode;
    viewName = overrides.accountName ?? accountName;
    error = null;
    errorKey = null;

    if (!viewTerm || !viewCode) {
      errorKey = 'tb_drill_missing_context';
      modal?.show();
      return;
    }
    modal?.show();
    await load();
  };

  export const close = () => {
    modal?.hide();
  };

  const resetState = () => {
    lines = [];
    error = null;
    errorKey = null;
    viewTerm = null;
    viewCode = null;
    viewSub = null;
    viewName = null;
  };

  const load = async () => {
    loading = true;
    error = null;
    errorKey = null;
    try {
      const path = viewSub != null
        ? `/api/ledger/${viewTerm}/${viewCode}/${viewSub}`
        : `/api/ledger/${viewTerm}/${viewCode}`;
      const r = await axios.get(path);
      lines = r.data || [];
    } catch (e) {
      error = e?.response?.data?.error || e.message || 'ledger load failed';
      lines = [];
    } finally {
      loading = false;
    }
  };

  const openJournal = (l) => {
    close();
    link(`/journal/${l.year}/${l.month}`);
  };

  const counterAccountLabel = (l) => {
    const code = viewCode ?? accountCode;
    if (l.debitAccount === code) {
      return l.creditAccount + (l.creditSubAccount ? '-' + l.creditSubAccount : '');
    }
    return l.debitAccount + (l.debitSubAccount ? '-' + l.debitSubAccount : '');
  };

  const formatNum = (n) => {
    if (n == null) return '';
    return Number(n).toLocaleString('en-US');
  };

  const formatDate = (d) => {
    if (!d) return '';
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  };

  $: fullLedgerHref = (viewCode ?? accountCode) && (viewTerm ?? term)
    ? ((viewSub ?? subCode) != null
        ? `/ledger/${viewTerm ?? term}/${viewCode ?? accountCode}/${viewSub ?? subCode}`
        : `/ledger/${viewTerm ?? term}/${viewCode ?? accountCode}`)
    : '#';

  onMount(() => {
    modal = new Modal(modalEl);
    modalEl.addEventListener('hidden.bs.modal', resetState);
    return () => modalEl.removeEventListener('hidden.bs.modal', resetState);
  });
</script>

<style>
  .tb-drill-account { font-family: monospace; margin-left: 0.4rem; }
  .tb-col-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .tb-drill-table { font-size: 0.85rem; }
  .tb-drill-meta { font-size: 0.85rem; }
</style>
