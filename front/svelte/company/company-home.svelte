<div class="page-title d-flex justify-content-between">
  <h1><BilingualText key="settings" /></h1>
</div> 
<div class="full-height-1">
  <div class="col-6" style="padding:10px;">
    <TableMaintenance
      title={$bi('company_class')}
      endpoint={'/api/company/kinds'}
      bind:minimize={companyMinimize}
      columns={[
{ type: "id", name: $bi('id_column')},
{ type: "order", name: 'displayOrder'},
{ type: "text", name: 'name', title: $bi('company_class_name'), align: "left"},
{ type: "checkbox", name: 'isClient', title: $bi('customer'), width: "50px"}
    ]}></TableMaintenance>
  </div>
</div>

<script>
import TableMaintenance from '../components/table-maintenance.svelte';

import BilingualText from '../components/bilingual-text.svelte';
import { bi } from '../../javascripts/bilingual.js';
export let status;

let companyMinimize = false;
</script>