<div class="page-title d-flex justify-content-between">
  <h1><BilingualText key="settings" /></h1>
</div> 
<div class="full-height-1">
  <div class="col-6" style="padding:10px;">
    <TableMaintenance
      title={$bi('item_class_label')}
      endpoint={'/api/item/classes'}
      bind:minimize={itemMinimize}
      columns={[
        { type: "id", name: 'id'},
        { type: "order", name: 'displayOrder'},
        { type: "text", name: 'name', title: $bi('class_name_label'), align: "left"},
        { type: "checkbox", name: 'product', title: $bi('home_col_product'), width: "50px"},
        { type: "checkbox", name: 'inventoryManagement', title: $bi('home_col_inventory_mgmt'), width: "100px"}
    ]}></TableMaintenance>
  </div>
</div>
<script>
import TableMaintenance from '../components/table-maintenance.svelte';

import BilingualText from '../components/bilingual-text.svelte';
import { bi } from '../../javascripts/bilingual.js';
export let status;

let itemMinimize = false;
</script>