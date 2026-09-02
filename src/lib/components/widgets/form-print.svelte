<div class="menu">
  <div class="body">
    <ul class="list-group list-group-flush">
      <li class="list-group-item">
        <span class="widget-list-label"><BilingualText key="download_journal_title" stacked={false} /></span>
        <span class="widget-list-actions">
          <a href="/forms/explanatory_journal/{status?.fy?.term || 1}?format=html" target="_blank" aria-label="HTML">
            <Icon icon="mdi:language-html5" width="24" color="#E34F26" />
          </a>
          <a href="/forms/explanatory_journal/{status?.fy?.term || 1}?format=pdf" download="{$bi('journal')}-{today}.pdf" aria-label="PDF">
            <Icon icon="mdi:file-pdf-box" width="24" color="#D32F2F" />
          </a>
        </span>
      </li>
      <li class="list-group-item">
        <span class="widget-list-label"><BilingualText key="download_gl_title" stacked={false} /></span>
        <span class="widget-list-actions">
          <a href="/forms/general_ledger/{status?.fy?.term || 1}?format=html" target="_blank" aria-label="HTML">
            <Icon icon="mdi:language-html5" width="24" color="#E34F26" />
          </a>
          <a href="/forms/general_ledger/{status?.fy?.term || 1}?format=pdf" download="{$bi('ledger')}-{today}.pdf" aria-label="PDF">
            <Icon icon="mdi:file-pdf-box" width="24" color="#D32F2F" />
          </a>
        </span>
      </li>
      <li class="list-group-item">
        <span class="widget-list-label"><BilingualText key="download_sl_title" stacked={false} /></span>
        <span class="widget-list-actions">
          <a href="/forms/subsidiary_ledger/{status?.fy?.term || 1}?format=html" target="_blank" aria-label="HTML">
            <Icon icon="mdi:language-html5" width="24" color="#E34F26" />
          </a>
          <a href="/forms/subsidiary_ledger/{status?.fy?.term || 1}?format=pdf" download="{$bi('subsidiary_ledger')}-{today}.pdf" aria-label="PDF">
            <Icon icon="mdi:file-pdf-box" width="24" color="#D32F2F" />
          </a>
        </span>
      </li>
      <li class="list-group-item">
        <span class="widget-list-label"><BilingualText key="download_tb_title" stacked={false} /></span>
        <span class="widget-list-actions">
          <a href="/forms/trial_balance/{status?.fy?.term || 1}?format=html" target="_blank" aria-label="HTML">
            <Icon icon="mdi:language-html5" width="24" color="#E34F26" />
          </a>
          <a href="/forms/trial_balance/{status?.fy?.term || 1}?format=pdf" download="{$bi('trial_balance')}-{today}.pdf" aria-label="PDF">
            <Icon icon="mdi:file-pdf-box" width="24" color="#D32F2F" />
          </a>
        </span>
      </li>
      <li class="list-group-item">
        <span class="widget-list-label"><BilingualText key="download_fs_title" stacked={false} /></span>
        <span class="widget-list-actions">
          <a href="/forms/financial_statement/{status?.fy?.term || 1}?format=html" target="_blank" aria-label="HTML">
            <Icon icon="mdi:language-html5" width="24" color="#E34F26" />
          </a>
          <a href="/forms/financial_statement/{status?.fy?.term || 1}?format=pdf" download="{$bi('report_financial')}-{today}.pdf" aria-label="PDF">
            <Icon icon="mdi:file-pdf-box" width="24" color="#D32F2F" />
          </a>
        </span>
      </li>
    </ul>
  </div>
</div>

<style>
.widget-list-label {
  flex: 1 1 12rem;
  min-width: 0;
}
.widget-list-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex: 0 0 auto;
}
</style>

<script>
import {onMount} from 'svelte';
import Icon from '@iconify/svelte';

import BilingualText from '$lib/components/BilingualText.svelte';
import { bi } from '$lib/i18n/bilingual.js';
export let status = {};
let today;

onMount(() => {
  let now = new Date();
  today = `${now.getUTCFullYear()}${("00"+(now.getMonth()+1).toString()).slice(-2)}${("00"+now.getDate().toString()).slice(-2)}`;
})
</script>
