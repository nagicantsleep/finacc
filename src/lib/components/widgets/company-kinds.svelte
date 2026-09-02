<script>
import TableMaintenance from '$lib/components/TableMaintenance.svelte';

export let status;
export let options = {};
</script>

<TableMaintenance
  endpoint={'/api/company/kinds'}
  initialValues={options.initialValues}
  columns={[
    { type: "id", name: 'id'},
    { type: "order", name: 'displayOrder'},
    { type: "text", name: 'name', title: "company_class_name", align: "left"},
    { type: "checkbox", name: 'isClient', title: "customer", width: "50px"}
]}>
</TableMaintenance>
