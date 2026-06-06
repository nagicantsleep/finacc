<div class="row" style="padding-top:10px;">
  <div class="col-2">
    {#if !company}
    <button type="button" class="btn btn-warning"
      on:click={() => {
        link(`/company/new?kind=1`);
      }}><BilingualText key="company_info_register" /></button>
    {:else}
    <button type="button" class="btn btn-primary"
      on:click={() => {
        link(`/company/entry/${company.id}`);
      }}><BilingualText key="company_info_confirm" /></button>
    {/if}
  </div>
</div>
<div class="row">
  <div class="col-7" style="padding:10px;">
    <SelectTerm
      bind:status={status}>
    </SelectTerm>
  </div>
  <div class="col-3" style="padding:10px;">
    {#if ( status.user.accounting || status.user.fiscal_browsing ) }
    <FormPrint
        status={status}>
    </FormPrint>
    {/if}
  </div>
</div>
<div class="row">
  {#if ( status.user.approvable )}
  <div class="col-7" style="padding:10px;">
    <Approve
      bind:status={status}
      bind:toast={toast} />
  </div>
  {/if}
</div>
{#if ( status.user.administrable) }
<div class="row">
  <div class="col-6" style="padding:10px;">
    <Backup bind:toast={toast} bind:status={status}/>
  </div>
</div>
{/if}
<div class="row">
  {#if ( status.user.administrable) }
  <div class="col-4" style="padding:10px;">
    <TableMaintenance
      title={$bi('company_class')}
      endpoint={'/api/company/kinds'}
      bind:minimize={companyMinimize}
      columns={[
  { type: "id", name: 'id'},
  { type: "order", name: 'displayOrder'},
  { type: "text", name: 'name', title: $bi('company_class_name'), align: "left"},
  { type: "checkbox", name: 'isClient', title: $bi('customer'), width: "50px"}
]}></TableMaintenance>
  </div>
  <div class="col-8" style="padding:10px;">
    <TableMaintenance
      title={$bi('transaction_kind')}
      endpoint={'/api/transaction/kinds'}
      bind:minimize={transactionMinimize}
      columns={[
  { type: "id", name: 'id'},
  { type: "order", name: 'displayOrder'},
  { type: "text", name: 'label', title: $bi('home_col_doc_type_name'), align: "left"},
  { type: "checkbox", name: 'hasDetails', title: $bi('has_details'), width: "100px"},
  { type: "dropdown", name: 'hasDocument', title: $bi('home_col_doc_present'), width: "100px",
    source: transactionDocSource
  },
  { type: "checkbox", name: 'forCustomer', title: $bi('home_col_for_client'), width: "70px"},
  { type: "dropdown", name: 'bookId', title: $bi('home_col_created_voucher'), width: '200px',
    func: getClasses
  }
]}></TableMaintenance>
  </div>
  {/if}
</div>
<div class="row">
  {#if ( status.user.administrable) }
  <div class="col-6" style="padding:10px;">
    <TableMaintenance
      title={$bi('voucher_class')}
      endpoint={'/api/voucher/classes'}
      bind:minimize={voucherMinimize}
      columns={[
  { type: "id", name: 'id'},
  { type: "order", name: 'displayOrder'},
  { type: "text", name: 'name', title: $bi('company_class_name'), align: "left"},
  { type: "checkbox", name: 'send', title: $bi('home_col_send'), width: "50px"},
  { type: "dropdown", name: 'form', title: $bi('program_name'), width: "150px",
  	source: voucherFormSource
  }
]}></TableMaintenance>
  </div>
  {/if}
  {#if ( status.user.administrable) }
  <div class="col-6" style="padding:10px;">
    <TableMaintenance
      title={$bi('item_class')}
      endpoint={'/api/item/classes'}
      bind:minimize={itemMinimize}
      columns={[
  { type: "id", name: 'id'},
  { type: "order", name: 'displayOrder'},
  { type: "text", name: 'name', title: $bi('item_class_name'), align: "left"},
  { type: "checkbox", name: 'product', title: $bi('home_col_product'), width: "50px"},
  { type: "checkbox", name: 'inventoryManagement', title: $bi('inventory_management'), width: "100px"}
]}></TableMaintenance>
  </div>
  {/if}
</div>
<div class="row">
  {#if ( status.user.administrable) }
  <div class="col-6" style="padding:10px;">
    <TableMaintenance
      title={$bi('home_tax_rule')}
      endpoint={'/api/tax-rule'}
      bind:minimize={taxRuleMinimize}
      columns={[
  { type: "id", name: 'id'},
  { type: "order", name: 'displayOrder'},
  { type: "text", name: 'label', title: $bi('home_col_label'), align: "left"},
  { type: "dropdown", name: 'taxClass', title: $bi('home_col_tax_method'), width: "80px",
  	source: taxMethodSource
  },
  { type: "numeric", name: 'rate', title: $bi('home_col_tax_rate'), width: "50px"},
  { type: "date", name: 'startDate', title: $bi('home_col_start_date'), width: "110px"},
  { type: "date", name: 'endDate', title: $bi('home_col_end_date'), width: "110px"}
]}></TableMaintenance>
  </div>
  <div class="col-6" style="padding:10px;">
    <SystemSettings
      title={$bi('system_settings')}
      bind:minimize={systemSettingsMinimize}
      bind:toast={toast}
    />
  </div>
  {/if}
</div>
<script>
import { onMount, beforeUpdate } from "svelte";
import { get } from 'svelte/store';

import  FormPrint from './form-print.svelte';
import  SelectTerm from './term.svelte';
import Backup from './backup.svelte';
import Approve from './approve.svelte';
import SystemSettings from './system-settings.svelte';
import TableMaintenance from '../components/table-maintenance.svelte';
import axios from 'axios';

import { bi } from '../../javascripts/bilingual.js';
import BilingualText from '../components/bilingual-text.svelte';
export	let	status;
export  let toast;
export  let alert;
export  let alert_level;

let companyMinimize = true;
let transactionMinimize = true;
let voucherMinimize = true;
let itemMinimize = true;
let taxRuleMinimize = true;
let systemSettingsMinimize = true;
let company;

$: transactionDocSource = [
  [0, $bi('none_opt')],
  [1, $bi('optional')],
  [2, $bi('required')],
];
$: voucherFormSource = [
  ['invoice', $bi('invoice_form_label')],
  ['receipt', $bi('receipt_form_label')],
  ['estimate', $bi('estimate_form_label')]
];
$: taxMethodSource = [
  [0, $bi('home_tax_exempt')],
  [1, $bi('home_tax_inner')],
  [2, $bi('home_tax_outer')],
  [9, $bi('home_tax_separate')]
];

const link = (href) => {
  let pathes = href.split('/');
  status.current = pathes[1];
  window.history.pushState(status, "", href);
  status.pathname = href;
}

beforeUpdate(() => {
  console.log(status);
  if  (( !status.fy ) ||
       ( !status.fy.term )) {
    alert = get(bi)('sidebar_select_term');
    alert_level = 'danger';
  }
})

onMount(() => {
  console.log('home onMount');
  axios.get('/api/user').then((res) => {
    status.user = res.data.user;
  });
  axios.get('/api/company/?kind=1').then((res) => {
    const companies = res.data.companies;
    if  ( companies.length > 0 )  {
      company = companies[0];
    } else {
      alert = get(bi)('sidebar_no_company');
      alert_level = 'danger';
    }
    console.log({company});
    if  (( !status.fy ) ||
         ( !status.fy.term )) {
      alert = get(bi)('sidebar_select_term');
      alert_level = 'danger';
    }
  })
})

const getClasses = async () => {
  let result = await axios.get('/api/voucher/classes');
  let source = [];
  for ( let value of result.data.values )  {
    source.push([value.id, value.name]);
  }
  return  (source);
}

</script>
    