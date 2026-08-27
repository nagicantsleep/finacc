<script>
import BilingualText from '$lib/components/BilingualText.svelte';
import TableMaintenance from '$lib/components/TableMaintenance.svelte';

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