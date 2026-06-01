<TableMaintenance
  title="transaction_kind"
  endpoint={'/api/transaction/kinds'}
  columns={[
  { type: "id", name: 'id'},
  { type: "order", name: 'displayOrder'},
  { type: "text", name: 'label', title: "kind", align: "left"},
  { type: "checkbox", name: 'hasDetails', title: "明細有無", width: "100px"},
  { type: "dropdown", name: 'hasDocument', title: "document", width: "100px",
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
]}></TableMaintenance>

<script>
import TableMaintenance from './table-maintenance.svelte';
import BilingualText from '../components/bilingual-text.svelte';
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
