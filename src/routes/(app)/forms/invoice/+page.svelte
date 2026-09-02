<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import View from '$lib/components/forms/invoice/invoice.svelte';

  export let data;

  $: transaction = data.invoice || data.transaction || {
    zip: '100-0001',
    address1: '東京都千代田区千代田1-1',
    address2: '',
    companyName: data.company?.name || '取引先株式会社',
    no: 'INV-0001',
    issueDate: new Date().toISOString(),
    handleUser: { memberships: [], legalName: data.user?.name || '担当者' },
    amount: 110000,
    tax: 10000,
    taxClass: 1,
    lines: [
      { itemId: 1, itemName: 'クラウド会計システム月額利用料', itemSpec: 'Standard Plan', unitPrice: 100000, itemNumber: 1, unit: '月', amount: 100000, tax: 10000, taxRule: { taxClass: 1 }, description: '' }
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
  <title>{$bi('title_invoice')} :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  <View {transaction} {company} />
</div>
