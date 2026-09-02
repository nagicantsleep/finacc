<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import View from '$lib/components/forms/estimate/estimate.svelte';

  export let data;

  $: transaction = data.estimate || data.transaction || {
    companyName: '取引先株式会社',
    subject: 'クラウド会計導入支援業務',
    paymentMethod: '月末締め翌月末払い',
    deliveryLimit: new Date(Date.now() + 30 * 86400000).toISOString(),
    expiringDate: new Date(Date.now() + 60 * 86400000).toISOString(),
    no: 'EST-0001',
    issueDate: new Date().toISOString(),
    handleUser: { memberships: [], legalName: data.user?.name || '担当者' },
    amount: 150000,
    tax: 15000,
    taxClass: 1,
    lines: [
      { itemId: 1, itemName: 'クラウド会計導入支援業務', itemSpec: '初期設定・データ移行', unitPrice: 150000, itemNumber: 1, unit: '式', amount: 150000, tax: 15000, taxRule: { taxClass: 1 }, description: '' }
    ]
  };

  $: company = data.company || {
    name: data.tenant?.name || 'Hieronymus Corp',
    zip: '100-0001',
    address1: '東京都港区六本木1-1-1',
    address2: '',
    tel: '03-1234-5678',
    bankName: '三井住友銀行',
    bankBranchName: '本店営業部',
    accountType: 0,
    accountNo: '1234567'
  };
</script>

<svelte:head>
  <title>{$bi('title_estimate')} :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  <View {transaction} {company} />
</div>
