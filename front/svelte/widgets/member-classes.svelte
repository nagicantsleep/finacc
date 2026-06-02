<script>
import TableMaintenance from './table-maintenance.svelte';
import { bi } from '../../javascripts/bilingual.js';

export let status;
</script>
<TableMaintenance
  endpoint={'/api/member/classes'}
  columns={[
    { type: "id", name: 'id'},
    { type: "order", name: 'displayOrder'},
    { type: "text", name: 'title', title: $bi('member_class_title'), align: "left"},
    { type: "checkbox", name: 'executive', title: $bi('member_executive'), width: "50px"},
    { type: "checkbox", name: 'officer', title: $bi('member_officer'), width: "50px"},
    { type: "checkbox", name: 'fullTime', title: $bi('member_fulltime'), width: "50px"},
    { type: "checkbox", name: 'insurance', title: $bi('member_salary_paid'), width: "50px"},
    { type: "checkbox", name: 'socialInsurance', title: $bi('member_social_insurance'), width: "100px"}
]}></TableMaintenance>