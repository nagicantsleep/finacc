<script>
  import BankLedger from '$lib/components/bank-ledger/bank-ledger.svelte';
  export let data;
</script>

<BankLedger status={{ user: data.user, fy: data.currentFy }} />
