<script>
import TableMaintenance from '$lib/components/TableMaintenance.svelte';
import BilingualText from '$lib/components/BilingualText.svelte';
import { bi } from '$lib/i18n/bilingual.js';

export let status;
export let options = {};

$: voucherClassSource = options.voucherClassSource || [];
</script>

<TableMaintenance
  title="transaction_kind"
  endpoint={'/api/transaction/kinds'}
  initialValues={options.initialValues}
  columns={[
  { type: "id", name: 'id'},
  { type: "order", name: 'displayOrder'},
  { type: "text", name: 'label', title: "kind", align: "left"},
  { type: "checkbox", name: 'hasDetails', title: "has_details", width: "100px"},
  { type: 'dropdown', name: 'hasDocument', title: "has_document", width: "100px",
    source:[
      [0, $bi('home_opt_none')],
      [1, $bi('home_opt_optional')],
      [2, $bi('home_opt_required')],
    ]
  },
  { type: "checkbox", name: 'forCustomer', title: "customer", width: "70px"},
  { type: "dropdown", name: 'bookId', title: "voucher_class", width: '200px',
    source: voucherClassSource
  }
]}></TableMaintenance>
