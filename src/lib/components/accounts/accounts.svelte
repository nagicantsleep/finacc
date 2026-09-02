<div class="list">
  <div class="page-title d-flex justify-content-between align-items-center flex-wrap">
    <h1 class="page-title-bilingual mb-0"><BilingualText key="account_management2" inline={true} /></h1>
  </div>
  <div class="full-height-1 fontsize-12pt">
    <AccountsList
      status={status}
      lines={lines}
      accounts={accounts}
      on:open={openAccount}>
    </AccountsList>
  </div>
</div>

<AccountModal
  account={account}
  subAccount={subAccount}
  mode={mode}
  status={status}
  modal={modal}
  on:close={updateAccounts}>
</AccountModal>

<style>
.page-title-bilingual {
  display: inline-flex;
  align-items: center;
  line-height: 1.3;
}
.page-title {
  margin-bottom: 1rem;
}
</style>

<script>
import { onMount, afterUpdate } from 'svelte';
import { invalidate } from '$app/navigation';
import AccountsList from './accounts-list.svelte';
import AccountModal from './account-modal.svelte';
import { setAccounts } from '$lib/client/cross-slip.js';
import { numeric } from '$lib/utils.js';

import BilingualText from '$lib/components/BilingualText.svelte';

export let status;
export let initialAccounts = null;

let accounts = [];
let lines = [];
let modal;
let mode;
let account = {};
let subAccount = {};

const ready = () => {
  lines = [];
  let last_account = {};
  for (let i = 0; i < accounts.length; i++) {
    const row = accounts[i];
    const new_line = {
      aclId: row.acl_id,
      aclCode: row.acl_code
    };
    if (last_account.major_name != row.major_name) {
      new_line.majorName = row.major_name;
      new_line.majorNameVi = row.major_nameVi || '';
    } else {
      new_line.majorName = '';
      new_line.majorNameVi = '';
    }
    if (last_account.middle_name != row.middle_name) {
      new_line.middleName = row.middle_name;
      new_line.middleNameVi = row.middle_nameVi || '';
    } else {
      new_line.middleName = '';
      new_line.middleNameVi = '';
    }
    if (last_account.minor_name != row.minor_name) {
      new_line.minorName = row.minor_name;
      new_line.minorNameVi = row.minor_nameVi || '';
    } else {
      new_line.minorName = '';
      new_line.minorNameVi = '';
    }
    if (
      new_line.major_name != '' ||
      new_line.middle_name != '' ||
      new_line.minor_name != ''
    ) {
      lines.push(new_line);
    }
    if (row.name && row.name != '') {
      lines.push({
        majorName: '',
        middleName: '',
        minorName: '',
        accountName: row.name,
        accountNameVi: row.nameVi || '',
        subAccountName: '',
        subAccountNameVi: '',
        taxClass: row.subAccounts && row.subAccounts.length > 0 ? 0 : row.taxClass,
        key: row.key ? row.key : '',
        debit: row.debit ? numeric(row.debit) : 0,
        credit: row.credit ? numeric(row.credit) : 0,
        remaining: row.balance ? numeric(row.balance) : 0,
        subCode: -1,
        code: row.code
      });
      if (row.subAccounts && row.subAccounts.length > 0) {
        for (let j = 0; j < row.subAccounts.length; j++) {
          const sub = row.subAccounts[j];
          lines.push({
            majorName: '',
            middleName: '',
            minorName: '',
            accountName: '',
            accountNameVi: '',
            subAccountName: sub.name,
            subAccountNameVi: sub.nameVi || '',
            taxClass: sub.taxClass,
            key: sub.key,
            debit: sub.debit ? numeric(sub.debit) : 0,
            credit: sub.credit ? numeric(sub.credit) : 0,
            remaining: sub.balance ? numeric(sub.balance) : 0,
            subCode: sub.code,
            code: row.code
          });
        }
      }
    }
    last_account = row;
  }
};

const applyAccounts = (data) => {
  accounts = Array.isArray(data) ? data : [];
  setAccounts(accounts);
  ready();
};

$: if (initialAccounts) {
  applyAccounts(initialAccounts);
}

const updateAccounts = () => {
  invalidate('app:accounts');
};

onMount(async () => {
  try {
    const bs = await import('bootstrap');
    const el = document.getElementById('account-modal');
    if (el) {
      modal = new bs.Modal(el);
    }
  } catch (e) {
    console.error('Modal init error', e);
  }
});

let openModal = false;
afterUpdate(() => {
  if (openModal) {
    modal.show();
    openModal = false;
  }
});

const openAccount = (event) => {
  const args = event.detail;
  mode = args.mode;
  account = args.account;
  subAccount = args.subAccount;
  openModal = true;
};
</script>
