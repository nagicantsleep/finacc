<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import VoucherView from '$lib/components/voucher/voucher.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'voucher',
    pathname: '/voucher',
    state: data.viewState || 'list'
  };
</script>

<svelte:head>
  <title>{$bi('title_voucher')} :: Hieronymus</title>
</svelte:head>

<div class="voucher-page container-fluid px-0">
  <VoucherView
    bind:status
    vouchers={data.vouchers}
    selectedVoucher={data.selectedVoucher}
    voucherClasses={data.voucherClasses}
    accounts={data.accounts}
    dates={data.dates}
    viewState={data.viewState}
    filters={data.filters}
  />
</div>
