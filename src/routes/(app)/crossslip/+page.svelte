<script>
  import CrossSlipEditor from '$lib/components/cross-slip/cross-slip.svelte';
  import Toast from '$lib/components/common/Toast.svelte';

  export let data;

  let toast;
  const now = new Date();

  let slip = {
    year: data.currentFy.startDate ? new Date(data.currentFy.startDate).getFullYear() : now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    lines: [
      { debitAmount: '', creditAmount: '', debitTax: 0, creditTax: 0 }
    ]
  };
</script>

<svelte:head>
  <title>振替伝票入力 :: Hieronymus</title>
</svelte:head>

<div class="crossslip-page container-fluid px-0">
  <CrossSlipEditor
    accounts={data.accounts}
    taxRules={data.taxRules}
    fy={data.currentFy}
    bind:slip
  />
  <Toast bind:toast />
</div>
