<TableMaintenance
  endpoint={'/api/item/classes'}
  columns={[
    { type: "id", name: 'id'},
    { type: "order", name: 'displayOrder'},
    { type: "text", name: 'name', title: "item_class", align: "left"},
    { type: "checkbox", name: 'product', title: "product", width: "50px"},
    { type: "checkbox", name: 'inventoryManagement', title: "inventory_management", width: "100px"}
]}></TableMaintenance>
<script>
import TableMaintenance from './table-maintenance.svelte';
import BilingualText from '../../components/bilingual-text.svelte';

export let status;
</script>
