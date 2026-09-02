<script>
import TableMaintenance from '$lib/components/TableMaintenance.svelte';

export let status;
export let options = {};
</script>

<TableMaintenance
  title="voucher_class"
  endpoint={'/api/voucher/classes'}
  initialValues={options.initialValues}
  columns={[
  { type: "id", name: 'id'},
  { type: "order", name: 'displayOrder'},
  { type: "text", name: 'name', title: "company_class_name", align: "left"},
  { type: "checkbox", name: 'send', title: "send", width: "50px"},
  { type: "dropdown", name: 'form', title: "program_name", width: "200px",
  source: [
    [ 'invoice', 'invoice_form_label' ],
    [ 'receipt', 'receipt_form_label' ],
    [ 'estimate', 'estimate_form_label']
    ]
  }
  ]}></TableMaintenance>
