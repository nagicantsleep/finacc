<script>
  import View from '$lib/components/forms/receipt/receipt.svelte';

  export let data;

  $: transaction = data.receipt || data.transaction || {
    zip: '100-0001',
    address1: '東京都千代田区千代田1-1',
    address2: '',
    companyName: data.company?.name || '取引先株式会社',
    no: 'REC-0001',
    issueDate: new Date().toISOString(),
    handleUser: { memberships: [], legalName: data.user?.name || '担当者' },
    amount: 50000,
    tax: 5000,
    taxClass: 1,
    lines: [
      { itemId: 1, itemName: 'コンサルティングサービス料金', itemSpec: '', unitPrice: 50000, itemNumber: 1, unit: '式', amount: 50000, tax: 5000, taxRule: { taxClass: 1 }, description: '領収済' }
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
  <title>領収書 :: Hieronymus</title>
</svelte:head>

<div class="page-container container-fluid px-0">
  <View {transaction} {company} />
</div>
