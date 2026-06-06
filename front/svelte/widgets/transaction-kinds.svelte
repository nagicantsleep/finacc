<script>
import TableMaintenance from './table-maintenance.svelte';
import BilingualText from '../components/bilingual-text.svelte';
import { bi } from '../../javascripts/bilingual.js';
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
  { type: "dropdown", name: 'hasDocument', title: "document", width: "100px",
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
