<script>
import TableMaintenance from './table-maintenance.svelte';
import BilingualText from '../components/bilingual-text.svelte';

export let status;

</script>

<TableMaintenance
  title="voucher_class"
  endpoint={'/api/voucher/classes'}
  columns={[
  { type: "id", name: 'id'},
  { type: "order", name: 'displayOrder'},
  { type: "text", name: 'name', title: "company_class_name", align: "left"},
  { type: "checkbox", name: 'send', title: "send", width: "50px"},
  { type: "dropdown", name: 'form', title: "プログラム名", width: "200px",
  source: [
    [ 'invoice', '請求書' ],
    [ 'receipt', '領収書' ],
    [ 'estimate', '見積書']
    ]
  }
  ]}></TableMaintenance>
