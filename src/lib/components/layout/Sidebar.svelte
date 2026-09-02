<script>
  import { page } from '$app/stores';
  import Icon from '@iconify/svelte';
  import BilingualText from '$lib/components/BilingualText.svelte';
  import menu from '$lib/config/module-list.js';
  import { sidebarCollapsed } from '$lib/client/ui.js';

  export let user = {};
  export let company = {};
  export let currentFy = {};

  $: currentPath = $page.url.pathname;
  $: status = { user, company, fy: currentFy };
  $: toggleLabel = $sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar';

  const MODULE_I18N = {
    workspace: 'workspace',
    menu: 'workspace',
    journal: 'journal',
    ledger: 'ledger',
    'bank-ledger': 'bank_ledger',
    'trial-balance': 'trial_balance',
    'reports/trial-balance': 'trial_balance_v2',
    changes: 'changes',
    voucher: 'voucher_info',
    accounts: 'account_management2',
    company: 'company_management',
    registry: 'registry_management',
    attendance: 'attendance_management',
    payroll: 'payroll_management',
    expense: 'expense_management',
    project: 'project_management',
    task: 'task_management',
    transaction: 'transaction_document',
    item: 'item_management',
    member: 'member_management',
    tenant: 'tenant_settings',
    home: 'tenant_settings',
    closing: 'closing',
    simulation: 'simulation'
  };

  function iconifyName(name) {
    if (!name) return 'bi:circle';
    if (name.includes(':')) return name;
    const dash = name.indexOf('-');
    return dash === -1 ? name : `${name.slice(0, dash)}:${name.slice(dash + 1)}`;
  }

  function hrefFor(entry) {
    if (typeof entry.href === 'function') {
      const href = entry.href(status);
      return href.replace(/\/$/, '') || '/';
    }
    return '#';
  }

  function isVisible(entry) {
    if (!entry.title) return false;
    if (!entry.authority) return true;
    return entry.authority(user, company);
  }

  const toggleSidebar = () => {
    sidebarCollapsed.update((collapsed) => !collapsed);
  };
</script>

<aside class="main-sidebar">
  <div class="sidebar">
    <nav class="sidebar-nav mt-2">
      <ul class="nav nav-pills nav-sidebar flex-column">
        {#each menu as entry (entry.name)}
          {#if isVisible(entry)}
            <li class="nav-item">
              <a
                href={hrefFor(entry)}
                class="nav-link {currentPath.match(entry.match) ? 'active' : ''}"
                data-type={entry.name}
                title={entry.title}
              >
                <span class="sidebar-row">
                  <span class="sidebar-row__icon">
                    <Icon class="nav-icon" icon={iconifyName(entry.icon?.name)} />
                  </span>
                  <span class="sidebar-row__text">
                    {#if MODULE_I18N[entry.name]}
                      <BilingualText key={MODULE_I18N[entry.name]} stacked={true} />
                    {:else}
                      {entry.title}
                    {/if}
                  </span>
                </span>
              </a>
            </li>
          {/if}
        {/each}
      </ul>
    </nav>

    <div class="sidebar-footer">
      <button
        type="button"
        class="sidebar-toggle"
        title={toggleLabel}
        aria-label={toggleLabel}
        on:click={toggleSidebar}
      >
        <i
          class="bi {$sidebarCollapsed ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar-inset-reverse'}"
          aria-hidden="true"
        ></i>
      </button>
    </div>
  </div>
</aside>

<style>
  .sidebar-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }
  .sidebar-row__icon {
    flex: 0 0 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
  }
  .sidebar-row__text {
    flex: 1 1 auto;
    min-width: 0;
    display: inline-flex;
    line-height: 1.2;
  }
  .nav-pills .nav-link {
    border-radius: 0;
    color: var(--sidebar-text, #eee);
    padding: 0.5rem 1rem;
    transition: background-color 0.15s ease-in-out, padding 0.2s ease-in-out;
  }
  .nav-pills .nav-link:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .nav-pills .nav-link.active {
    background-color: var(--bs-primary, #2a9d8f) !important;
    color: #fff !important;
    font-weight: bold;
  }
</style>
