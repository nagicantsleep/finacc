<!--
  LifecycleModals — Issue #238 (E2.10).

  Lock / Clone / Unlock confirm modals for a scenario, replacing the inline
  window.confirm/prompt used in #235. Bilingual. The parent (detail.svelte)
  controls visibility via the `kind` prop and listens for `confirm`/`cancel`.

  Props:
    kind         'lock' | 'clone' | 'unlock' | null   — which modal to show
    scenario     the scenario object (name, entry count via entryCount)
    entryCount   number of entries (for lock warning)
  Events:
    confirm      detail = { name?, reason? }
    cancel
-->
{#if kind}
<div class="lc-backdrop" on:click|self={cancel}>
  <div class="lc-modal">
    <div class="lc-header">
      <h5>
        {#if kind === 'lock'}<BilingualText primary="ロックの確認" secondary="Xác nhận khóa" inline={true} />
        {:else if kind === 'clone'}<BilingualText primary="シナリオを複製" secondary="Nhân bản kịch bản" inline={true} />
        {:else if kind === 'unlock'}<BilingualText primary="ロック解除（管理者）" secondary="Mở khóa (quản trị)" inline={true} />
        {/if}
      </h5>
      <button type="button" class="btn-close" aria-label="Close" on:click={cancel}></button>
    </div>
    <div class="lc-body">
      {#if kind === 'lock'}
        <p>
          <BilingualText
            primary="ロックすると仕訳・前提・期間は編集できなくなります。新しい下書きを作るには複製してください。"
            secondary="Sau khi khóa, không thể sửa bút toán / giả định / kỳ. Hãy nhân bản để tạo bản nháp mới."
            inline={true} />
        </p>
        <ul class="lc-summary">
          <li><strong>{scenario?.name}</strong></li>
          <li><BilingualText primary="仕訳数" secondary="Số bút toán" inline={true} />: {entryCount}</li>
        </ul>
      {:else if kind === 'clone'}
        <div class="mb-2">
          <label class="form-label lc-label">新しい名称 / Tên mới *</label>
          <input type="text" class="form-control form-control-sm" bind:value={cloneName} maxlength="200" />
        </div>
      {:else if kind === 'unlock'}
        <p class="text-warning-emphasis">
          <BilingualText
            primary="ロック解除は監査ログに記録されます。理由を入力してください。"
            secondary="Mở khóa sẽ được ghi vào nhật ký kiểm toán. Vui lòng nhập lý do."
            inline={true} />
        </p>
        <div class="mb-2">
          <label class="form-label lc-label">理由 / Lý do *</label>
          <input type="text" class="form-control form-control-sm" bind:value={reason} maxlength="500" />
        </div>
      {/if}
      {#if localError}<div class="alert alert-danger py-1 mb-0">{localError}</div>{/if}
    </div>
    <div class="lc-footer">
      <button type="button" class="btn btn-sm btn-secondary" on:click={cancel}>
        <BilingualText primary="キャンセル" secondary="Hủy" inline={true} />
      </button>
      <button type="button" class="btn btn-sm" class:btn-primary={kind !== 'unlock'} class:btn-warning={kind === 'unlock'} on:click={doConfirm}>
        {#if kind === 'lock'}<BilingualText primary="ロック" secondary="Khóa" inline={true} />
        {:else if kind === 'clone'}<BilingualText primary="複製" secondary="Nhân bản" inline={true} />
        {:else if kind === 'unlock'}<BilingualText primary="ロック解除" secondary="Mở khóa" inline={true} />
        {/if}
      </button>
    </div>
  </div>
</div>
{/if}

<script>
  import { createEventDispatcher } from 'svelte';
  import BilingualText from '../../components/bilingual-text.svelte';

  export let kind = null;
  export let scenario = null;
  export let entryCount = 0;

  const dispatch = createEventDispatcher();

  let cloneName = '';
  let reason = '';
  let localError = null;

  // Seed the clone name when the modal opens.
  $: if (kind === 'clone' && scenario && cloneName === '') {
    cloneName = `${scenario.name} (copy)`;
  }
  $: if (!kind) { cloneName = ''; reason = ''; localError = null; }

  const cancel = () => dispatch('cancel');

  const doConfirm = () => {
    localError = null;
    if (kind === 'clone') {
      if (!cloneName || cloneName.trim() === '') { localError = 'name is required / Tên bắt buộc'; return; }
      dispatch('confirm', { name: cloneName.trim() });
    } else if (kind === 'unlock') {
      if (!reason || reason.trim() === '') { localError = 'reason is required / Lý do bắt buộc'; return; }
      dispatch('confirm', { reason: reason.trim() });
    } else {
      dispatch('confirm', {});
    }
  };
</script>

<style>
  .lc-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center; z-index: 1060;
  }
  .lc-modal { background: #fff; border-radius: 6px; width: 90%; max-width: 460px; box-shadow: 0 4px 24px rgba(0,0,0,0.2); }
  .lc-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #eee; }
  .lc-header h5 { margin: 0; }
  .lc-body { padding: 1rem; }
  .lc-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.75rem 1rem; border-top: 1px solid #eee; }
  .lc-summary { list-style: none; padding-left: 0; margin: 0.5rem 0 0; }
  .lc-label { font-size: 0.8rem; margin-bottom: 0.1rem; }
</style>
