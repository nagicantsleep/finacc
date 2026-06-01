<script>
import BilingualText from '../components/bilingual-text.svelte';
import TableMaintenance from './table-maintenance.svelte';

export let status;
</script>

<TableMaintenance
  endpoint={'/api/company/kinds'}
  columns={[
    { type: "id", name: 'id'},
    { type: "order", name: 'displayOrder'},
    { type: "text", name: 'name', title: "company_class_name", align: "left"},
    { type: "checkbox", name: 'isClient', title: "customer", width: "50px"}
]}>
</TableMaintenance>