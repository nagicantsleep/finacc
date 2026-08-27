<script>
import TableMaintenance from '$lib/components/TableMaintenance.svelte';
import BilingualText from '$lib/components/BilingualText.svelte';
import { bi } from '$lib/i18n/bilingual.js';
import axios from 'axios';

export let status;

const getClasses = async () => {
  let result = await axios.get('/api/voucher/classes');
  let source = [];
  for ( let value of result.data.values )  {
    source.push([value.id, value.name]);
  }
  console.log('getClasses', source);
  return  (source);
}
</script>
<TableMaintenance
  title="transaction_kind"
  endpoint={'/api/transaction/kinds'}
  columns={[
  { type: "id", name: 'id'},
  { type: "order", name: 'displayOrder'},
  { type: "text", name: 'label', title: "kind", align: "left"},
  { type: "checkbox", name: 'hasDetails', title: "has_details", width: "100px"},
  { type: '$lib/client/document.js', width: "100px",
    source:[
      [0, $bi('home_opt_none')],
      [1, $bi('home_opt_optional')],
      [2, $bi('home_opt_required')],
    ]
  },
  { type: "checkbox", name: 'forCustomer', title: "customer", width: "70px"},
  { type: "dropdown", name: 'bookId', title: "voucher_class", width: '200px',
    func: getClasses
  }
]}></TableMaintenance>
