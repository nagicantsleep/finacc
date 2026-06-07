<!--
  Simulation Scenario Detail — Issue #235 (E2.7).

  4 tabs: Entries (CRUD), Trial Balance (reuse TrialBalanceList), Comparison
  (basic table; diff colouring lands in #237/E2.9), Assumptions (E3 placeholder).

  Header carries the red SIMULATION banner + lifecycle actions
  (Edit / Clone / Lock / Archive / Unlock) gated by status + role.
  Lock / Clone modal confirms land in #238/E2.10; here they are inline confirms.
-->
{#key scenarioId}
<div class="container-fluid">
  <div class="page-title d-flex justify-content-between mt-2">
    <h1 class="page-title-bilingual">
      {#if scenario}{scenario.name}{:else}<BilingualText primary="シナリオ" secondary="Kịch bản" inline={true} />{/if}
      {#if scenario}<span class="badge sim-badge-{scenario.status} ms-2">{scenario.status}</span>{/if}
    </h1>
    <button type="button" class="btn btn-sm btn-outline-secondary" on:click={back}>
      <BilingualText primary="一覧へ戻る" secondary="Về danh sách" inline={true} />
    </button>
  </div>

  <div class="sim-banner" class:sim-banner-archived={scenario && scenario.status === 'archived'}>
    <i class="bi bi-exclamation-triangle-fill"></i>
    <span>
      SIMULATION - NOT OFFICIAL ACCOUNTING REPORT — DO NOT FILE FOR TAX
      {#if scenario}· {scenario.name}{/if}
      {#if scenario && scenario.status === 'archived'} · ARCHIVED{/if}
      {#if scenario && scenario.status === 'locked' && scenario.lockedAt} · locked {fmtDate(scenario.lockedAt)}{/if}
    </span>
  </div>

  {#if scenario}
  <div class="d-flex gap-2 mb-2 flex-wrap">
    {#if scenario.status === 'draft' && canEdit}
      <button class="btn btn-sm btn-primary" on:click={openEntryForm}>
        <BilingualText primary="仕訳追加" secondary="Thêm bút toán" inline={true} />
      </button>
      <button class="btn btn-sm btn-outline-primary" on:click={doLock}>
        <BilingualText primary="ロック" secondary="Khóa" inline={true} />
      </button>
    {/if}
    {#if scenario.status !== 'archived' && canEdit}
      <button class="btn btn-sm btn-outline-secondary" on:click={doClone}>
        <BilingualText primary="複製" secondary="Nhân bản" inline={true} />
      </button>
      <button class="btn btn-sm btn-outline-danger" on:click={doArchive}>
        <BilingualText primary="アーカイブ" secondary="Lưu trữ" inline={true} />
      </button>
    {/if}
    {#if scenario.status === 'locked' && isAdmin}
      <button class="btn btn-sm btn-outline-warning" on:click={doUnlock}>
        <BilingualText primary="ロック解除" secondary="Mở khóa" inline={true} />
      </button>
    {/if}
  </div>

  <ul class="nav nav-tabs sim-tabs" role="tablist">
    {#each tabs as t}
      <li class="nav-item" role="presentation">
        <button type="button" class="nav-link sim-tab"
          class:active={activeTab === t.value}
          on:click={() => selectTab(t.value)}
          role="tab" aria-selected={activeTab === t.value}>
          <BilingualText primary={t.ja} secondary={t.vi} inline={true} />
        </button>
      </li>
    {/each}
  </ul>

  <div class="sim-tab-body mt-2">
    {#if activeTab === 'entries'}
      <table class="table table-bordered table-sm sim-entry-table">
        <thead class="table-light">
          <tr>
            <th>日付 / Ngày</th>
            <th>借方科目 / TK Nợ</th>
            <th class="sim-num">借方金額 / Số tiền Nợ</th>
            <th>貸方科目 / TK Có</th>
            <th class="sim-num">貸方金額 / Số tiền Có</th>
            <th>摘要 / Diễn giải</th>
            <th class="sim-actions"></th>
          </tr>
        </thead>
        <tbody>
          {#each entries as e (e.id)}
            <tr>
              <td>{fmtDate(e.date)}</td>
              <td>{e.debitAccount}{#if e.debitSubAccount}-{e.debitSubAccount}{/if}</td>
              <td class="sim-num">{fmtNum(e.debitAmount)}</td>
              <td>{e.creditAccount}{#if e.creditSubAccount}-{e.creditSubAccount}{/if}</td>
              <td class="sim-num">{fmtNum(e.creditAmount)}</td>
              <td>{e.memo || ''}</td>
              <td class="sim-actions">
                {#if scenario.status === 'draft' && canEdit}
                  <button class="btn btn-sm btn-link p-0 me-2" on:click={() => editEntry(e)}>
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-link p-0 text-danger" on:click={() => deleteEntry(e)}>
                    <i class="bi bi-trash"></i>
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
          {#if entries.length === 0}
            <tr><td colspan="7" class="text-center text-muted py-3">
              <BilingualText primary="仮想仕訳がありません" secondary="Chưa có bút toán ảo" inline={true} />
            </td></tr>
          {/if}
        </tbody>
      </table>

    {:else if activeTab === 'tb'}
      {#if tbLoading}<p class="text-muted">...</p>
      {:else if tbError}<p class="text-danger">{tbError}</p>
      {:else}
        <TrialBalanceList lines={tbLines} expanded={tbExpanded} languageMode="ja-vi"
          onToggle={toggleTbAccount} onRowClick={() => {}} />
      {/if}

    {:else if activeTab === 'comparison'}
      {#if cmpLoading}<p class="text-muted">...</p>
      {:else if cmpError}<p class="text-danger">{cmpError}</p>
      {:else}
        <table class="table table-bordered table-sm sim-cmp-table">
          <thead class="table-light">
            <tr>
              <th>科目 / Mã</th>
              <th>名称 / Tên</th>
              <th class="sim-num">実績 / Thực tế</th>
              <th class="sim-num">調整 / Điều chỉnh</th>
              <th class="sim-num">予測 / Mô phỏng</th>
              <th class="sim-num">差異 / Chênh lệch</th>
              <th class="sim-num">差異% / %</th>
            </tr>
          </thead>
          <tbody>
            {#each cmpLines as l (l.code + ':' + (l.subCode || ''))}
              <tr>
                <td class="sim-code">{l.code}{#if l.subCode}-{l.subCode}{/if}</td>
                <td>{l.name || ''}</td>
                <td class="sim-num">{fmtNum(l.actual.endingBalance)}</td>
                <td class="sim-num">{fmtNum(l.adjustment.endingBalance)}</td>
                <td class="sim-num">{fmtNum(l.simulated.endingBalance)}</td>
                <td class="sim-num" class:sim-up={l.difference > 0} class:sim-down={l.difference < 0}>
                  {fmtNum(l.difference)}
                </td>
                <td class="sim-num">{l.differencePct == null ? '—' : l.differencePct.toFixed(1) + '%'}</td>
              </tr>
            {/each}
            {#if cmpLines.length === 0}
              <tr><td colspan="7" class="text-center text-muted py-3">データなし / Không có dữ liệu</td></tr>
            {/if}
          </tbody>
        </table>
      {/if}

    {:else if activeTab === 'assumptions'}
      <div class="sim-placeholder text-muted">
        <i class="bi bi-cone-striped"></i>
        <BilingualText
          primary="前提条件 (繰り返し仕訳・成長率・資金予測) は E3 で実装予定"
          secondary="Giả định (bút toán định kỳ, tỷ lệ tăng trưởng, dự phóng tiền mặt) sẽ có ở E3"
          inline={true} />
      </div>
    {/if}
  </div>
  {:else if loading}
    <p class="text-muted">...</p>
  {:else if error}
    <p class="text-danger">{error}</p>
  {/if}
</div>

{#if showEntryForm}
<div class="sim-modal-backdrop" on:click|self={closeEntryForm}>
  <div class="sim-modal">
    <div class="sim-modal-header">
      <h5><BilingualText primary={editingId ? '仕訳編集' : '仕訳追加'} secondary={editingId ? 'Sửa bút toán' : 'Thêm bút toán'} inline={true} /></h5>
      <button type="button" class="btn-close" aria-label="Close" on:click={closeEntryForm}></button>
    </div>
    <div class="sim-modal-body">
      {#if entryError}<div class="alert alert-danger py-1">{entryError}</div>{/if}
      <div class="mb-2">
        <label class="form-label sim-form-label">日付 / Ngày *</label>
        <input type="date" class="form-control form-control-sm" bind:value={entryForm.date} />
        <small class="text-muted">{scenario ? `${fmtDate(scenario.simPeriodFrom)} → ${fmtDate(scenario.simPeriodTo)}` : ''}</small>
      </div>
      <div class="row g-2">
        <div class="col">
          <label class="form-label sim-form-label">借方科目 / TK Nợ *</label>
          <input type="text" class="form-control form-control-sm" bind:value={entryForm.debitAccount} placeholder="10200000" />
        </div>
        <div class="col">
          <label class="form-label sim-form-label">借方金額 / Số tiền Nợ *</label>
          <input type="number" class="form-control form-control-sm" bind:value={entryForm.debitAmount} on:input={syncCredit} />
        </div>
      </div>
      <div class="row g-2 mt-1">
        <div class="col">
          <label class="form-label sim-form-label">貸方科目 / TK Có *</label>
          <input type="text" class="form-control form-control-sm" bind:value={entryForm.creditAccount} placeholder="20200000" />
        </div>
        <div class="col">
          <label class="form-label sim-form-label">貸方金額 / Số tiền Có *</label>
          <input type="number" class="form-control form-control-sm" bind:value={entryForm.creditAmount} />
        </div>
      </div>
      <div class="mb-2 mt-1">
        <label class="form-label sim-form-label">摘要 / Diễn giải</label>
        <input type="text" class="form-control form-control-sm" bind:value={entryForm.memo} maxlength="500" />
      </div>
      <small class="text-muted">
        <BilingualText primary="借方=貸方、金額>0、借方科目≠貸方科目" secondary="Nợ=Có, số tiền>0, TK Nợ≠TK Có" inline={true} />
      </small>
    </div>
    <div class="sim-modal-footer">
      <button type="button" class="btn btn-sm btn-secondary" on:click={closeEntryForm}>
        <BilingualText primary="キャンセル" secondary="Hủy" inline={true} />
      </button>
      <button type="button" class="btn btn-sm btn-primary" on:click={submitEntry} disabled={entrySubmitting}>
        <BilingualText primary="保存" secondary="Lưu" inline={true} />
      </button>
    </div>
  </div>
</div>
{/if}
{/key}

<script>
  import axios from 'axios';
  import { currentPage, link } from '../../javascripts/router.js';
  import { buildSubtotals } from '../../../libs/reporting/tb-subtotal.js';
  import { withAccountParents } from '../../../libs/reporting/tb-hierarchy.js';
  import BilingualText from '../components/bilingual-text.svelte';
  import TrialBalanceList from '../reports/trial-balance-list.svelte';

  export let toast = undefined;
  export let status = undefined;

  let scenario = null;
  let entries = [];
  let loading = false;
  let error = null;
  let lastFetched = '';

  let activeTab = 'entries';
  const tabs = [
    { value: 'entries', ja: '仮想仕訳', vi: 'Bút toán' },
    { value: 'tb', ja: '試算表', vi: 'Bảng cân đối' },
    { value: 'comparison', ja: '比較', vi: 'So sánh' },
    { value: 'assumptions', ja: '前提条件', vi: 'Giả định' },
  ];

  // TB tab
  let tbLines = [];
  let tbExpanded = new Set();
  let tbLoading = false;
  let tbError = null;
  let tbLoaded = false;

  // Comparison tab
  let cmpLines = [];
  let cmpLoading = false;
  let cmpError = null;
  let cmpLoaded = false;

  // Entry form
  let showEntryForm = false;
  let editingId = null;
  let entrySubmitting = false;
  let entryError = null;
  let entryForm = emptyEntry();

  $: isAdmin = !!(status && status.user && status.user.administrable);
  $: canEdit = !!(status && status.user && (status.user.administrable || status.user.accounting));

  $: scenarioId = (() => {
    const m = ($currentPage || '').match(/^\/simulation\/scenarios\/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  })();

  $: if ($currentPage && $currentPage !== lastFetched && scenarioId != null) {
    lastFetched = $currentPage;
    tbLoaded = false;
    cmpLoaded = false;
    fetchScenario();
    fetchEntries();
  }

  function emptyEntry() {
    return { date: '', debitAccount: '', debitAmount: '', creditAccount: '', creditAmount: '', memo: '' };
  }

  const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? String(d).slice(0, 10) : dt.toISOString().slice(0, 10);
  };
  const fmtNum = (n) => (n == null ? '' : Number(n).toLocaleString('en-US'));

  const fetchScenario = async () => {
    if (scenarioId == null) return;
    loading = true; error = null;
    try {
      const res = await axios.get(`/api/simulation/scenarios/${scenarioId}`);
      scenario = res.data.scenario;
    } catch (e) {
      error = e.response?.data?.message || e.message || 'fetch failed';
      scenario = null;
    } finally { loading = false; }
  };

  const fetchEntries = async () => {
    if (scenarioId == null) return;
    try {
      const res = await axios.get(`/api/simulation/scenarios/${scenarioId}/entries`);
      entries = res.data.entries || [];
    } catch (e) {
      entries = [];
    }
  };

  const fetchTb = async () => {
    if (scenarioId == null) return;
    tbLoading = true; tbError = null;
    try {
      const res = await axios.get(`/api/simulation/scenarios/${scenarioId}/trial-balance?reportType=combined`);
      const sub = buildSubtotals(res.data.lines || []);
      tbLines = withAccountParents(sub);
      tbExpanded = new Set();
      tbLoaded = true;
    } catch (e) {
      tbError = e.response?.data?.message || e.message || 'fetch failed';
    } finally { tbLoading = false; }
  };

  const fetchCmp = async () => {
    if (scenarioId == null) return;
    cmpLoading = true; cmpError = null;
    try {
      const res = await axios.get(`/api/simulation/scenarios/${scenarioId}/comparison?reportType=combined`);
      cmpLines = res.data.lines || [];
      cmpLoaded = true;
    } catch (e) {
      cmpError = e.response?.data?.message || e.message || 'fetch failed';
    } finally { cmpLoading = false; }
  };

  const selectTab = (v) => {
    activeTab = v;
    if (v === 'tb' && !tbLoaded) fetchTb();
    if (v === 'comparison' && !cmpLoaded) fetchCmp();
  };

  const toggleTbAccount = (code) => {
    if (tbExpanded.has(code)) tbExpanded.delete(code);
    else tbExpanded.add(code);
    tbExpanded = new Set(tbExpanded);
  };

  // --- entry form ---
  const openEntryForm = () => {
    editingId = null;
    entryForm = emptyEntry();
    if (scenario) entryForm.date = fmtDate(scenario.simPeriodFrom);
    entryError = null;
    showEntryForm = true;
  };
  const editEntry = (e) => {
    editingId = e.id;
    entryForm = {
      date: fmtDate(e.date),
      debitAccount: e.debitAccount,
      debitAmount: e.debitAmount,
      creditAccount: e.creditAccount,
      creditAmount: e.creditAmount,
      memo: e.memo || '',
    };
    entryError = null;
    showEntryForm = true;
  };
  const closeEntryForm = () => { showEntryForm = false; };
  const syncCredit = () => {
    if (!entryForm.creditAmount || entryForm.creditAmount === '') {
      entryForm.creditAmount = entryForm.debitAmount;
    }
  };

  const validateEntry = () => {
    const d = Number(entryForm.debitAmount);
    const c = Number(entryForm.creditAmount);
    if (!entryForm.date) return 'date is required';
    if (!entryForm.debitAccount || !entryForm.creditAccount) return 'accounts are required';
    if (!(d > 0) || !(c > 0)) return 'amounts must be > 0';
    if (d !== c) return 'debit must equal credit';
    if (entryForm.debitAccount === entryForm.creditAccount) return 'debit and credit accounts must differ';
    return null;
  };

  const submitEntry = async () => {
    entryError = validateEntry();
    if (entryError) return;
    entrySubmitting = true;
    try {
      const payload = {
        date: entryForm.date,
        debitAccount: entryForm.debitAccount,
        debitAmount: Number(entryForm.debitAmount),
        creditAccount: entryForm.creditAccount,
        creditAmount: Number(entryForm.creditAmount),
        memo: entryForm.memo,
      };
      if (editingId) {
        await axios.patch(`/api/simulation/scenarios/${scenarioId}/entries/${editingId}`, payload);
      } else {
        await axios.post(`/api/simulation/scenarios/${scenarioId}/entries`, payload);
      }
      showEntryForm = false;
      tbLoaded = false; cmpLoaded = false;
      await fetchEntries();
      if (toast) toast.show('保存しました / Đã lưu');
    } catch (e) {
      entryError = e.response?.data?.message || e.message || 'save failed';
    } finally { entrySubmitting = false; }
  };

  const deleteEntry = async (e) => {
    if (!window.confirm('削除しますか? / Xóa bút toán này?')) return;
    try {
      await axios.delete(`/api/simulation/scenarios/${scenarioId}/entries/${e.id}`);
      tbLoaded = false; cmpLoaded = false;
      await fetchEntries();
    } catch (err) {
      if (toast) toast.show(err.response?.data?.message || 'delete failed');
    }
  };

  // --- lifecycle actions (inline confirm; modal versions in #238/E2.10) ---
  const doLock = async () => {
    if (!window.confirm('ロックしますか? 以後、仕訳の編集はできません。 / Khóa kịch bản? Sau khi khóa không sửa được bút toán.')) return;
    await postAction('lock');
  };
  const doArchive = async () => {
    if (!window.confirm('アーカイブしますか? / Lưu trữ kịch bản?')) return;
    await postAction('archive');
  };
  const doUnlock = async () => {
    const reason = window.prompt('ロック解除の理由 / Lý do mở khóa:');
    if (!reason) return;
    await postAction('unlock', { reason });
  };
  const doClone = async () => {
    const name = window.prompt('複製先の名称 / Tên bản sao:', scenario ? `${scenario.name} (copy)` : '');
    if (!name) return;
    try {
      const res = await axios.post(`/api/simulation/scenarios/${scenarioId}/clone`, { name });
      if (res.data.scenario && res.data.scenario.id) link(`/simulation/scenarios/${res.data.scenario.id}`);
    } catch (e) {
      if (toast) toast.show(e.response?.data?.message || 'clone failed');
    }
  };
  const postAction = async (action, body = {}) => {
    try {
      await axios.post(`/api/simulation/scenarios/${scenarioId}/${action}`, body);
      await fetchScenario();
      if (toast) toast.show('完了 / Hoàn tất');
    } catch (e) {
      if (toast) toast.show(e.response?.data?.message || `${action} failed`);
    }
  };

  const back = () => link('/simulation/scenarios');
</script>

<style>
  .sim-banner {
    background: #fde7e7; border: 1px solid #c00000; color: #900;
    padding: 0.4rem 0.8rem; border-radius: 4px; font-weight: 600;
    margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;
  }
  .sim-banner-archived { background: #e9ecef; border-color: #adb5bd; color: #495057; }
  .badge.sim-badge-draft { background: #6c757d; }
  .badge.sim-badge-locked { background: #0d6efd; }
  .badge.sim-badge-archived { background: #adb5bd; color: #333; }
  .sim-tabs .sim-tab { font-size: 0.9rem; }
  .sim-entry-table, .sim-cmp-table { font-size: 0.9rem; }
  .sim-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .sim-code { font-family: monospace; white-space: nowrap; }
  .sim-actions { width: 5rem; text-align: center; }
  .sim-up { color: #0a7d28; }
  .sim-down { color: #c00000; }
  .sim-placeholder { padding: 2rem; text-align: center; display: flex; gap: 0.5rem; justify-content: center; align-items: center; }
  .sim-form-label { font-size: 0.8rem; margin-bottom: 0.1rem; }

  .sim-modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center; z-index: 1050;
  }
  .sim-modal { background: #fff; border-radius: 6px; width: 90%; max-width: 540px; box-shadow: 0 4px 24px rgba(0,0,0,0.2); }
  .sim-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #eee; }
  .sim-modal-header h5 { margin: 0; }
  .sim-modal-body { padding: 1rem; max-height: 70vh; overflow-y: auto; }
  .sim-modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.75rem 1rem; border-top: 1px solid #eee; }
</style>
