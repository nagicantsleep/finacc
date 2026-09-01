<script>
import TableMaintenance from '$lib/components/TableMaintenance.svelte';

export let status;
export let options = {};
</script>

<TableMaintenance
  endpoint={'/api/item/classes'}
  initialValues={options.initialValues}
  columns={[
    { type: "id", name: 'id'},
    { type: "order", name: 'displayOrder'},
    { type: "text", name: 'name', title: "item_class", align: "left"},
    { type: "checkbox", name: 'product', title: "product", width: "50px"},
    { type: "checkbox", name: 'inventoryManagement', title: "inventory_management", width: "100px"}
]}></TableMaintenance>
