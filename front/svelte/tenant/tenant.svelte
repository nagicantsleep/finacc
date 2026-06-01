<div class="row" style="padding-top:10px;">
  <div class="col-12">
    <h4><i class="bi bi-gear-fill me-2"></i><BilingualText key="settings" /></h4>
    <hr>
  </div>
</div>
<div class="row">
  <div class="col-6" style="padding:10px;">
    <Backup bind:toast={toast} bind:status={status}/>
  </div>
  <div class="col-6" style="padding:10px;">
    <SystemSettings
      title="system_settings"
      bind:minimize={systemSettingsMinimize}
      bind:toast={toast}
    />
  </div>
</div>
<div class="row">
  <div class="col-4" style="padding:10px;">
    <TableMaintenance
      title="company_class"
      endpoint={'/api/company/kinds'}
      bind:minimize={companyMinimize}
      columns={[
        { type: "id", name: 'id'},
        { type: "order", name: 'displayOrder'},
        { type: "text", name: 'name', title: "company_class_name", align: "left"},
        { type: "checkbox", name: 'isClient', title: "customer", width: "50px"}
      ]}>
    </TableMaintenance>
  </div>
  <div class="col-8" style="padding:10px;">
    <TableMaintenance
      title="transaction_kind"
      endpoint={'/api/transaction/kinds'}
      bind:minimize={transactionMinimize}
      columns={[
        { type: "id", name: 'id'},
        { type: "order", name: 'displayOrder'},
        { type: "text", name: 'label', title: "document", align: "left"},
        { type: "checkbox", name: 'hasDetails', title: "detail", width: "100px"},
        { type: "dropdown", name: 'hasDocument', title: "file", width: "100px",
          source:[
            [0, 'なし'],
            [1, '任意'],
            [2, '必須'],
          ]
        },
        { type: "checkbox", name: 'forCustomer', title: "customer", width: "70px"},
        { type: "dropdown", name: 'bookId', title: "voucher_class", width: '200px',
          func: getClasses
        }
      ]}>
    </TableMaintenance>
  </div>
</div>
<div class="row">
  <div class="col-6" style="padding:10px;">
    <TableMaintenance
      title="voucher_class"
      endpoint={'/api/voucher/classes'}
      bind:minimize={voucherMinimize}
      columns={[
        { type: "id", name: 'id'},
        { type: "order", name: 'displayOrder'},
        { type: "text", name: 'name', title: "company_class_name", align: "left"},
        { type: "checkbox", name: 'send', title: "send", width: "50px"},
        { type: "dropdown", name: 'form', title: "kind", width: "150px",
          source: [
            [ 'invoice', '請求書' ],
            [ 'receipt', '領収書' ],
            [ 'estimate', '見積書']
          ]
        }
      ]}>
    </TableMaintenance>
  </div>
  <div class="col-6" style="padding:10px;">
    <TableMaintenance
      title="item_class"
      endpoint={'/api/item/classes'}
      bind:minimize={itemMinimize}
      columns={[
        { type: "id", name: 'id'},
        { type: "order", name: 'displayOrder'},
        { type: "text", name: 'name', title: "item_class_name", align: "left"},
        { type: "checkbox", name: 'product', title: "product", width: "50px"},
        { type: "checkbox", name: 'inventoryManagement', title: "inventory_management", width: "100px"}
      ]}>
    </TableMaintenance>
  </div>
</div>
<div class="row">
  <div class="col-6" style="padding:10px;">
    <TableMaintenance
      title="tax"
      endpoint={'/api/tax-rule'}
      bind:minimize={taxRuleMinimize}
      columns={[
        { type: "id", name: 'id'},
        { type: "order", name: 'displayOrder'},
        { type: "text", name: 'label', title: "item_name", align: "left"},
        { type: "dropdown", name: 'taxClass', title: "account_class", width: "80px",
          source: [
            [ 0, '非課税' ],
            [ 1, '内税' ],
            [ 2, '外税'],
            [ 9, '別計算']
          ]
        },
        { type: "numeric", name: 'rate', title: "tax", width: "50px"},
        { type: "date", name: 'startDate', title: "start_date", width: "110px"},
        { type: "date", name: 'endDate', title: "end_date", width: "110px"}
      ]}>
    </TableMaintenance>
  </div>
</div>

<script>
import { onMount } from 'svelte';
import axios from 'axios';

import Backup from '../home/backup.svelte';
import SystemSettings from '../home/system-settings.svelte';
import TableMaintenance from '../components/table-maintenance.svelte';
import BilingualText from '../components/bilingual-text.svelte';

export let status;
export let toast;

let companyMinimize = true;
let transactionMinimize = true;
let voucherMinimize = true;
let itemMinimize = true;
let taxRuleMinimize = true;
let systemSettingsMinimize = true;

const getClasses = async () => {
  let result = await axios.get('/api/voucher/classes');
  let source = [];
  for ( let value of result.data.values )  {
    source.push([value.id, value.name]);
  }
  return  (source);
}
</script>
