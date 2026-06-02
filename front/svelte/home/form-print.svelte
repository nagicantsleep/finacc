<div class="card">
  <div class="card-header">
    <h5 class="card-title"><BilingualText key="form_print" /></h5>
  </div>
  <div class="card-body">
    <ul class="list-group">
      <li class="list-group-item"><BilingualText key="download_journal_title" /><a href="/forms/explanatory_journal/{status.fy.term}?format=html" target="_blank">
          <Icon icon="mdi:language-html5" width="24" color="#E34F26" />
        </a>
        <a href="/forms/explanatory_journal/{status.fy.term}?format=pdf" download={$bi('form_print_journal') + '-' + today + '.pdf'}>
          <Icon icon="mdi:file-pdf-box" width="24" color="#D32F2F" />
        </a>
      </li>
      <li class="list-group-item"><BilingualText key="download_gl_title" /><a href="/forms/general_ledger/{status.fy.term}?format=html" target="_blank">
          <Icon icon="mdi:language-html5" width="24" color="#E34F26" />
        </a>
        <a href="/forms/general_ledger/{status.fy.term}?format=pdf" download={$bi('form_print_gl') + '-' + today + '.pdf'}>
          <Icon icon="mdi:file-pdf-box" width="24" color="#D32F2F" />
        </a>
      </li>
      <li class="list-group-item"><BilingualText key="download_sl_title" /><a href="/forms/subsidiary_ledger/{status.fy.term}?format=html" target="_blank">
          <Icon icon="mdi:language-html5" width="24" color="#E34F26" />
        </a>
        <a href="/forms/subsidiary_ledger/{status.fy.term}?format=pdf" download={$bi('form_print_sl') + '-' + today + '.pdf'}>
          <Icon icon="mdi:file-pdf-box" width="24" color="#D32F2F" />
        </a>
      </li>
      <li class="list-group-item"><BilingualText key="download_tb_title" /><a href="/forms/trial_balance/{status.fy.term}?format=html" target="_blank">
          <Icon icon="mdi:language-html5" width="24" color="#E34F26" />
        </a>
        <a href="/forms/trial_balance/{status.fy.term}?format=pdf" download={$bi('form_print_tb') + '-' + today + '.pdf'}>
          <Icon icon="mdi:file-pdf-box" width="24" color="#D32F2F" />
        </a>
      </li>
      <li class="list-group-item"><BilingualText key="download_fs_title" /><a href="/forms/financial_statement/{status.fy.term}?format=html" target="_blank">
          <Icon icon="mdi:language-html5" width="24" color="#E34F26" />
        </a>
        <a href="/forms/financial_statement/{status.fy.term}?format=pdf" download={$bi('form_print_fs') + '-' + today + '.pdf'}>
          <Icon icon="mdi:file-pdf-box" width="24" color="#D32F2F" />
        </a>
      </li>
    </ul>
  </div>
</div>

<script>
import {onMount} from 'svelte';
import Icon from '@iconify/svelte';

import BilingualText from '../components/bilingual-text.svelte';
import { bi } from '../../javascripts/bilingual.js';
export	let	status;
let today;

onMount(() => {
  let now = new Date();
  today = `${now.getUTCFullYear()}${("00"+(now.getMonth()+1).toString()).slice(-2)}${("00"+now.getDate().toString()).slice(-2)}`;
})
</script>
