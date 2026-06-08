<!--
  Simulation Assumptions Tab — Issue #271 (E3.10).

  Lists assumptions with CRUD, type-based wizard form, preview modal,
  and regenerate-all trigger.
-->
<div class="sim-assumptions">
  <div class="d-flex justify-content-between align-items-center mb-2">
    <h5 class="mb-0">
      <BilingualText primary="前提条件一覧" secondary="Danh sách giả định" inline={true} />
      {#if assumptionCount > 0}
        <small class="text-muted ms-2">({assumptionCount})</small>
      {/if}
    </h5>
    <div class="d-flex gap-2">
      {#if canRegenerate}
        <button class="btn btn-sm btn-outline-warning" on:click={doRegenerate} disabled={regenerating}>
          <BilingualText primary="前提から再生成" secondary="Tạo lại từ giả định" inline={true} />
        </button>
      {/if}
      {#if scenarioStatus === 'draft' && canEdit}
        <button class="btn btn-sm btn-primary" on:click={openWizard}>
          <i class="bi bi-plus-lg"></i>
          <BilingualText primary="前提追加" secondary="Thêm giả định" inline={true} />
        </button>
      {/if}
    </div>
  </div>

  {#if error}<div class="alert alert-danger py-1">{error}</div>{/if}
  {#if regenResult}<div class="alert alert-info py-1 small">{regenResult}</div>{/if}

  <table class="table table-bordered table-sm">
    <thead class="table-light">
      <tr>
        <th>タイプ / Loại</th>
        <th>名前 / Tên</th>
        <th>期間 / Kỳ hạn</th>
        <th>状態 / Trạng thái</th>
        <th class="sim-num">生成数 / SL</th>
        <th class="sim-actions"></th>
      </tr>
    </thead>
    <tbody>
      {#each assumptions as a (a.id)}
        <tr>
          <td><span class="badge sim-type-badge">{typeLabel(a.type)}</span></td>
          <td>{a.name}</td>
          <td class="sim-period">{fmtDate(a.startMonth)} → {a.endMonth ? fmtDate(a.endMonth) : '…'}</td>
          <td>{statusBadge(a.status)}</td>
          <td class="sim-num">{a.generatedCount}</td>
          <td class="sim-actions">
            {#if scenarioStatus === 'draft' && canEdit}
              <button class="btn btn-sm btn-link p-0 me-2" on:click={() => editAssumption(a)} title="編集 / Sửa">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-link p-0 me-2 text-info" on:click={() => previewAssumption(a)} title="プレビュー / Xem trước">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-link p-0 text-danger" on:click={() => deleteAssumption(a)} title="削除 / Xóa">
                <i class="bi bi-trash"></i>
              </button>
            {/if}
          </td>
        </tr>
      {/each}
      {#if assumptions.length === 0}
        <tr><td colspan="6" class="text-center text-muted py-3">
          <BilingualText primary="前提条件がありません" secondary="Chưa có giả định nào" inline={true} />
        </td></tr>
      {/if}
    </tbody>
  </table>
</div>

<!-- Preview modal -->
{#if previewing}
<div class="sim-modal-backdrop" on:click|self={closePreview}>
  <div class="sim-modal" style="max-width:720px">
    <div class="sim-modal-header">
      <h5><BilingualText primary="プレビュー" secondary="Xem trước" inline={true} /> — {previewAssumptionName}</h5>
      <button type="button" class="btn-close" on:click={closePreview}></button>
    </div>
    <div class="sim-modal-body">
      {#if previewLoading}
        <p class="text-muted">...</p>
      {:else if previewEntries.length === 0}
        <p class="text-muted">
          <BilingualText primary="仕訳がありません" secondary="Không có bút toán" inline={true} />
        </p>
      {:else}
        <table class="table table-bordered table-sm">
          <thead class="table-light">
            <tr>
              <th>日付 / Ngày</th>
              <th>借方 / TK Nợ</th>
              <th class="sim-num">借方金額 / Số tiền Nợ</th>
              <th>貸方 / TK Có</th>
              <th class="sim-num">貸方金額 / Số tiền Có</th>
              <th>摘要 / Diễn giải</th>
            </tr>
          </thead>
          <tbody>
            {#each previewEntries as e, i}
              <tr>
                <td>{e.date}</td>
                <td>{e.debitAccount}</td>
                <td class="sim-num">{fmtNum(e.debitAmount)}</td>
                <td>{e.creditAccount}</td>
                <td class="sim-num">{fmtNum(e.creditAmount)}</td>
                <td class="small">{e.memo || ''}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <small class="text-muted">
          <BilingualText primary={`${previewEntries.length} 件の仕訳 (未保存)`} secondary={`${previewEntries.length} bút toán (chưa lưu)`} inline={true} />
        </small>
      {/if}
    </div>
  </div>
</div>
{/if}

<!-- Assumption wizard modal -->
{#if showWizard}
<div class="sim-modal-backdrop" on:click|self={closeWizard}>
  <div class="sim-modal">
    <div class="sim-modal-header">
      <h5><BilingualText primary={editingAssumption ? '前提編集' : '前提追加'} secondary={editingAssumption ? 'Sửa giả định' : 'Thêm giả định'} inline={true} /></h5>
      <button type="button" class="btn-close" on:click={closeWizard}></button>
    </div>
    <div class="sim-modal-body">
      {#if wizardError}<div class="alert alert-danger py-1">{wizardError}</div>{/if}

      <div class="mb-2">
        <label class="form-label sim-form-label">タイプ / Loại *</label>
        <select class="form-select form-select-sm" bind:value={wizard.type} disabled={!!editingAssumption}>
          <option value=""><BilingualText primary="選択してください" secondary="Chọn loại" inline={true} /></option>
          <option value="recurring">定期的 / Định kỳ (recurring)</option>
          <option value="revenue_growth">収益成長 / Tăng trưởng doanh thu</option>
          <option value="expense_fixed">固定費用 / Chi phí cố định</option>
        </select>
      </div>

      <div class="mb-2">
        <label class="form-label sim-form-label">名前 / Tên *</label>
        <input type="text" class="form-control form-control-sm" bind:value={wizard.name} maxlength="200" />
      </div>

      <div class="row g-2">
        <div class="col">
          <label class="form-label sim-form-label">開始月 / Từ tháng *</label>
          <input type="date" class="form-control form-control-sm" bind:value={wizard.startMonth} />
        </div>
        <div class="col">
          <label class="form-label sim-form-label">終了月 / Đến tháng</label>
          <input type="date" class="form-control form-control-sm" bind:value={wizard.endMonth} />
        </div>
      </div>

      <!-- Dynamic fields per type -->
      {#if wizard.type === 'recurring'}
        <div class="mt-2 border-top pt-2">
          <label class="form-label sim-form-label">頻度 / Tần suất</label>
          <select class="form-select form-select-sm" bind:value={wizardParams.frequency}>
            <option value="monthly">毎月 / Hàng tháng</option>
            <option value="quarterly">四半期 / Hàng quý</option>
            <option value="yearly">毎年 / Hàng năm</option>
          </select>
          <div class="row g-2 mt-1">
            <div class="col">
              <label class="form-label sim-form-label">日 / Ngày trong tháng</label>
              <input type="number" class="form-control form-control-sm" bind:value={wizardParams.dayOfMonth} min="1" max="31" />
            </div>
            <div class="col">
              <label class="form-label sim-form-label">借方科目 / TK Nợ *</label>
              <input type="text" class="form-control form-control-sm" bind:value={wizardParams.debitAccount} />
            </div>
            <div class="col">
              <label class="form-label sim-form-label">貸方科目 / TK Có *</label>
              <input type="text" class="form-control form-control-sm" bind:value={wizardParams.creditAccount} />
            </div>
          </div>
          <div class="row g-2 mt-1">
            <div class="col">
              <label class="form-label sim-form-label">金額 / Số tiền *</label>
              <input type="number" class="form-control form-control-sm" bind:value={wizardParams.amount} min="1" />
            </div>
            <div class="col">
              <label class="form-label sim-form-label">摘要 / Diễn giải</label>
              <input type="text" class="form-control form-control-sm" bind:value={wizardParams.memo} />
            </div>
          </div>
        </div>

      {:else if wizard.type === 'revenue_growth'}
        <div class="mt-2 border-top pt-2">
          <div class="row g-2">
            <div class="col">
              <label class="form-label sim-form-label">収益科目 / TK Doanh thu *</label>
              <input type="text" class="form-control form-control-sm" bind:value={wizardParams.revenueAccount} />
            </div>
            <div class="col">
              <label class="form-label sim-form-label">相手科目 / TK Đối ứng *</label>
              <input type="text" class="form-control form-control-sm" bind:value={wizardParams.counterAccount} />
            </div>
          </div>
          <label class="form-label sim-form-label mt-1">成長タイプ / Loại tăng trưởng</label>
          <select class="form-select form-select-sm" bind:value={wizardParams.growthType}>
            <option value="percent">% / Phần trăm</option>
            <option value="fixed">固定増加 / Tăng cố định</option>
            <option value="manual">手動 / Thủ công</option>
            <option value="avg_last_3m">過去3ヶ月平均 / TB 3 tháng</option>
            <option value="last_month">前月 / Tháng trước</option>
          </select>
          <div class="row g-2 mt-1">
            <div class="col">
              <label class="form-label sim-form-label">基準値 / Giá trị cơ sở</label>
              <input type="number" class="form-control form-control-sm" bind:value={wizardParams.growthValue} />
            </div>
            {#if wizardParams.growthType === 'percent'}
              <div class="col">
                <label class="form-label sim-form-label">成長率 (%) / Tỷ lệ tăng</label>
                <input type="number" class="form-control form-control-sm" bind:value={wizardParams.growthRate} step="0.1" />
              </div>
            {:else if wizardParams.growthType === 'fixed'}
              <div class="col">
                <label class="form-label sim-form-label">増加額 / Mức tăng</label>
                <input type="number" class="form-control form-control-sm" bind:value={wizardParams.increment} />
              </div>
            {/if}
          </div>
          <label class="form-label sim-form-label mt-1">入金日数 / Ngày thu tiền</label>
          <select class="form-select form-select-sm" bind:value={wizardParams.collectionTimingDays}>
            <option value="0">即時 / Ngay</option>
            <option value="30">30日 / 30 ngày</option>
            <option value="60">60日 / 60 ngày</option>
            <option value="90">90日 / 90 ngày</option>
          </select>
        </div>

      {:else if wizard.type === 'expense_fixed'}
        <div class="mt-2 border-top pt-2">
          <div class="row g-2">
            <div class="col">
              <label class="form-label sim-form-label">費用科目 / TK Chi phí *</label>
              <input type="text" class="form-control form-control-sm" bind:value={wizardParams.expenseAccount} />
            </div>
            <div class="col">
              <label class="form-label sim-form-label">相手科目 / TK Đối ứng *</label>
              <input type="text" class="form-control form-control-sm" bind:value={wizardParams.counterAccount} />
            </div>
          </div>
          <label class="form-label sim-form-label mt-1">金額タイプ / Loại số tiền</label>
          <select class="form-select form-select-sm" bind:value={wizardParams.amountType}>
            <option value="fixed">固定 / Cố định</option>
            <option value="percent_of_sales">売上比 / % Doanh thu</option>
            <option value="headcount">人数ベース / Theo đầu người</option>
          </select>
          {#if wizardParams.amountType === 'fixed'}
            <label class="form-label sim-form-label mt-1">金額 / Số tiền</label>
            <input type="number" class="form-control form-control-sm" bind:value={wizardParams.amount} />
          {:else if wizardParams.amountType === 'percent_of_sales'}
            <div class="row g-2 mt-1">
              <div class="col">
                <label class="form-label sim-form-label">基準 / Cơ sở</label>
                <select class="form-select form-select-sm" bind:value={wizardParams.percentOf}>
                  <option value="sales">売上 / Doanh thu</option>
                  <option value="cogs">売上原価 / Giá vốn</option>
                </select>
              </div>
              <div class="col">
                <label class="form-label sim-form-label">% / Tỷ lệ</label>
                <input type="number" class="form-control form-control-sm" bind:value={wizardParams.percentOfValue} />
              </div>
            </div>
          {:else if wizardParams.amountType === 'headcount'}
            <div class="row g-2 mt-1">
              <div class="col">
                <label class="form-label sim-form-label">人数 / Số người</label>
                <input type="number" class="form-control form-control-sm" bind:value={wizardParams.headcount.count} min="1" />
              </div>
              <div class="col">
                <label class="form-label sim-form-label">月給 / Lương tháng</label>
                <input type="number" class="form-control form-control-sm" bind:value={wizardParams.headcount.salaryPerMonth} />
              </div>
            </div>
            <div class="row g-2 mt-1">
              <div class="col">
                <label class="form-label sim-form-label">給与科目 / TK Lương</label>
                <input type="text" class="form-control form-control-sm" bind:value={wizardParams.headcount.salaryAccount} />
              </div>
              <div class="col">
                <label class="form-label sim-form-label">保険科目 / TK Bảo hiểm</label>
                <input type="text" class="form-control form-control-sm" bind:value={wizardParams.headcount.insuranceAccount} />
              </div>
              <div class="col">
                <label class="form-label sim-form-label">保険率 (%) / Tỷ lệ BH</label>
                <input type="number" class="form-control form-control-sm" bind:value={wizardParams.headcount.insurancePct} />
              </div>
            </div>
          {/if}
          <label class="form-label sim-form-label mt-1">支払日数 / Ngày thanh toán</label>
          <select class="form-select form-select-sm" bind:value={wizardParams.paymentTimingDays}>
            <option value="0">即時 / Ngay</option>
            <option value="30">30日 / 30 ngày</option>
            <option value="60">60日 / 60 ngày</option>
          </select>
        </div>
      {/if}
    </div>
    <div class="sim-modal-footer">
      <button type="button" class="btn btn-sm btn-secondary" on:click={closeWizard}>
        <BilingualText primary="キャンセル" secondary="Hủy" inline={true} />
      </button>
      <button type="button" class="btn btn-sm btn-primary" on:click={submitAssumption} disabled={wizardSaving}>
        <BilingualText primary="保存" secondary="Lưu" inline={true} />
      </button>
    </div>
  </div>
</div>
{/if}

<script>
  import axios from 'axios';
  import BilingualText from '../../components/bilingual-text.svelte';

  export let scenarioId = null;
  export let scenarioStatus = 'draft';
  export let canEdit = true;
  export let canRegenerate = false;
  export let toast = undefined;

  let assumptions = [];
  let assumptionCount = 0;
  let error = null;

  // Preview state
  let previewing = false;
  let previewLoading = false;
  let previewEntries = [];
  let previewAssumptionName = '';

  // Wizard state
  let showWizard = false;
  let editingAssumption = null;
  let wizardSaving = false;
  let wizardError = null;
  let wizard = { type: '', name: '', startMonth: '', endMonth: '' };
  let wizardParams = {};

  // Regenerate
  let regenerating = false;
  let regenResult = null;

  // Watcher for scenarioId changes
  let lastId = null;
  $: if (scenarioId != null && scenarioId !== lastId) {
    lastId = scenarioId;
    fetchAssumptions();
  }

  const TYPE_LABELS = {
    recurring: '定期的 / Định kỳ',
    revenue_growth: '収益成長 / Tăng trưởng DT',
    expense_fixed: '固定費用 / Chi phí CĐ',
  };
  function typeLabel(t) { return TYPE_LABELS[t] || t; }

  const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? String(d).slice(0, 10) : dt.toISOString().slice(0, 10);
  };
  const fmtNum = (n) => (n == null ? '' : Number(n).toLocaleString('en-US'));

  function statusBadge(s) {
    const cls = s === 'active' ? 'bg-success' : 'bg-secondary';
    const label = s === 'active' ? '有効 / Active' : '無効 / Disabled';
    return `<span class="badge ${cls}">${label}</span>`;
  }

  async function fetchAssumptions() {
    if (scenarioId == null) return;
    try {
      const res = await axios.get(`/api/simulation/scenarios/${scenarioId}/assumptions`);
      assumptions = res.data.assumptions || [];
      assumptionCount = assumptions.length;
    } catch (e) {
      error = e.response?.data?.message || 'fetch assumptions failed';
    }
  }

  // --- Preview ---
  async function previewAssumption(a) {
    previewAssumptionName = a.name;
    previewing = true;
    previewLoading = true;
    previewEntries = [];
    try {
      const res = await axios.post(`/api/simulation/scenarios/${scenarioId}/assumptions/${a.id}/preview`);
      previewEntries = res.data.entries || [];
    } catch (e) {
      previewEntries = [];
    } finally { previewLoading = false; }
  }
  function closePreview() { previewing = false; }

  // --- Wizard ---
  function defaultParams(type) {
    if (type === 'recurring') return { frequency: 'monthly', dayOfMonth: 1, debitAccount: '', creditAccount: '', amount: null, memo: '' };
    if (type === 'revenue_growth') return { revenueAccount: '', counterAccount: '', growthType: 'percent', growthValue: null, growthRate: 0, increment: 0, collectionTimingDays: '0' };
    if (type === 'expense_fixed') return { expenseAccount: '', counterAccount: '', amountType: 'fixed', amount: null, percentOf: 'sales', percentOfValue: null, paymentTimingDays: '0', headcount: { count: 1, salaryPerMonth: null, salaryAccount: '', insuranceAccount: '', insurancePct: 15 } };
    return {};
  }

  function openWizard() {
    editingAssumption = null;
    wizard = { type: '', name: '', startMonth: '', endMonth: '' };
    wizardParams = {};
    wizardError = null;
    showWizard = true;
  }

  function editAssumption(a) {
    editingAssumption = a;
    wizard = { type: a.type, name: a.name, startMonth: fmtDate(a.startMonth), endMonth: a.endMonth ? fmtDate(a.endMonth) : '' };
    wizardParams = { ...a.parameters };
    wizardError = null;
    showWizard = true;
  }

  function closeWizard() {
    showWizard = false;
    editingAssumption = null;
  }

  // Reset wizardParams when type changes
  $: if (wizard.type && !editingAssumption) {
    wizardParams = defaultParams(wizard.type);
  }

  async function submitAssumption() {
    if (!wizard.type || !wizard.name || !wizard.startMonth) {
      wizardError = 'タイプ、名前、開始月は必須です / Loại, tên, tháng bắt đầu là bắt buộc';
      return;
    }
    wizardSaving = true; wizardError = null;
    try {
      const payload = {
        type: wizard.type,
        name: wizard.name,
        parameters: wizardParams,
        startMonth: wizard.startMonth,
        endMonth: wizard.endMonth || null,
      };
      if (editingAssumption) {
        await axios.patch(`/api/simulation/scenarios/${scenarioId}/assumptions/${editingAssumption.id}`, payload);
      } else {
        await axios.post(`/api/simulation/scenarios/${scenarioId}/assumptions`, payload);
      }
      closeWizard();
      await fetchAssumptions();
      if (toast) toast.show('保存しました / Đã lưu');
    } catch (e) {
      wizardError = e.response?.data?.message || 'save failed';
    } finally { wizardSaving = false; }
  }

  // --- Delete ---
  async function deleteAssumption(a) {
    if (!window.confirm(`削除しますか? / Xóa "${a.name}" ?`)) return;
    try {
      await axios.delete(`/api/simulation/scenarios/${scenarioId}/assumptions/${a.id}`);
      await fetchAssumptions();
    } catch (e) {
      if (toast) toast.show(e.response?.data?.message || 'delete failed');
    }
  }

  // --- Regenerate ---
  async function doRegenerate() {
    if (!window.confirm('生成された仕訳を削除し、前提条件から再生成します。手動仕訳は保持されます。\nXóa bút toán đã sinh và tạo lại từ giả định. Bút toán thủ công được giữ nguyên.')) return;
    regenerating = true; regenResult = null;
    try {
      const res = await axios.post(`/api/simulation/scenarios/${scenarioId}/regenerate`);
      regenResult = `削除 ${res.data.deletedCount} 件, 生成 ${res.data.insertedCount} 件 / Đã xóa ${res.data.deletedCount}, tạo mới ${res.data.insertedCount}`;
      await fetchAssumptions();
    } catch (e) {
      regenResult = e.response?.data?.message || 'regenerate failed';
    } finally { regenerating = false; }
  }
</script>

<style>
  .sim-assumptions { font-size: 0.9rem; }
  .sim-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .sim-actions { width: 6rem; text-align: center; }
  .sim-period { white-space: nowrap; }
  .sim-type-badge { background: #6f42c1; font-size: 0.75rem; }
  .sim-modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center; z-index: 1050;
  }
  .sim-modal { background: #fff; border-radius: 6px; width: 90%; max-width: 540px; box-shadow: 0 4px 24px rgba(0,0,0,0.2); }
  .sim-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #eee; }
  .sim-modal-header h5 { margin: 0; }
  .sim-modal-body { padding: 1rem; max-height: 70vh; overflow-y: auto; }
  .sim-modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.75rem 1rem; border-top: 1px solid #eee; }
  .sim-form-label { font-size: 0.8rem; margin-bottom: 0.1rem; }
</style>
