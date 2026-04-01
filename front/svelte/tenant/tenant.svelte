<div class="row" style="padding-top:10px;">
  <div class="col-12">
    <h4><i class="bi bi-gear-fill me-2"></i>会社設定</h4>
    <hr>
  </div>
</div>
<div class="row">
  <div class="col-6" style="padding:10px;">
    <Backup bind:toast={toast} bind:status={status}/>
  </div>
  <div class="col-6" style="padding:10px;">
    <SystemSettings
      title={'システム設定'}
      bind:minimize={systemSettingsMinimize}
      bind:toast={toast}
    />
  </div>
</div>
<div class="row">
  <div class="col-4" style="padding:10px;">
    <TableMaintenance
      title={'取引先種別'}
      endpoint={'/api/company/kinds'}
      bind:minimize={companyMinimize}
      columns={[
        { type: "id", name: 'id'},
        { type: "order", name: 'displayOrder'},
        { type: "text", name: 'name', title: "種別名", align: "left"},
        { type: "checkbox", name: 'isClient', title: "顧客", width: "50px"}
      ]}>
    </TableMaintenance>
  </div>
  <div class="col-8" style="padding:10px;">
    <TableMaintenance
      title={'取引文書種別'}
      endpoint={'/api/transaction/kinds'}
      bind:minimize={transactionMinimize}
      columns={[
        { type: "id", name: 'id'},
        { type: "order", name: 'displayOrder'},
        { type: "text", name: 'label', title: "文書種別名", align: "left"},
        { type: "checkbox", name: 'hasDetails', title: "明細有無", width: "100px"},
        { type: "dropdown", name: 'hasDocument', title: "書類有無", width: "100px",
          source:[
            [0, 'なし'],
            [1, '任意'],
            [2, '必須'],
          ]
        },
        { type: "checkbox", name: 'forCustomer', title: "顧客用", width: "70px"},
        { type: "dropdown", name: 'bookId', title: '作成証憑', width: '200px',
          func: getClasses
        }
      ]}>
    </TableMaintenance>
  </div>
</div>
<div class="row">
  <div class="col-6" style="padding:10px;">
    <TableMaintenance
      title={'証憑種別'}
      endpoint={'/api/voucher/classes'}
      bind:minimize={voucherMinimize}
      columns={[
        { type: "id", name: 'id'},
        { type: "order", name: 'displayOrder'},
        { type: "text", name: 'name', title: "種別名", align: "left"},
        { type: "checkbox", name: 'send', title: "差出", width: "50px"},
        { type: "dropdown", name: 'form', title: "プログラム名", width: "150px",
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
      title={'品目種別'}
      endpoint={'/api/item/classes'}
      bind:minimize={itemMinimize}
      columns={[
        { type: "id", name: 'id'},
        { type: "order", name: 'displayOrder'},
        { type: "text", name: 'name', title: "種別名", align: "left"},
        { type: "checkbox", name: 'product', title: "商品", width: "50px"},
        { type: "checkbox", name: 'inventoryManagement', title: "在庫管理", width: "100px"}
      ]}>
    </TableMaintenance>
  </div>
</div>
<div class="row">
  <div class="col-6" style="padding:10px;">
    <TableMaintenance
      title={'消費税区分'}
      endpoint={'/api/tax-rule'}
      bind:minimize={taxRuleMinimize}
      columns={[
        { type: "id", name: 'id'},
        { type: "order", name: 'displayOrder'},
        { type: "text", name: 'label', title: "ラベル", align: "left"},
        { type: "dropdown", name: 'taxClass', title: "方式", width: "80px",
          source: [
            [ 0, '非課税' ],
            [ 1, '内税' ],
            [ 2, '外税'],
            [ 9, '別計算']
          ]
        },
        { type: "numeric", name: 'rate', title: "税率", width: "50px"},
        { type: "date", name: 'startDate', title: "開始日", width: "110px"},
        { type: "date", name: 'endDate', title: "終了日", width: "110px"}
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
