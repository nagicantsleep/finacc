import Approve from '$lib/components/widgets/approve.svelte';
import Backup from '$lib/components/widgets/backup.svelte';
import Bookmark, { create as createBookmark, activate as activateBookmark } from '$lib/components/widgets/bookmark.svelte';
import CompanyKinds from '$lib/components/widgets/company-kinds.svelte';
import FormPrint from '$lib/components/widgets/form-print.svelte';
import HTMLPanel from '$lib/components/widgets/html-panel.svelte';
import ItemClasses from '$lib/components/widgets/item-classes.svelte';
import MemberClasses from '$lib/components/widgets/member-classes.svelte';
import MenuLink, { create as createMenuLink, activate as activateMenuLink } from '$lib/components/widgets/menu-link.svelte';
import Password from '$lib/components/widgets/password.svelte';
import SelectTerm from '$lib/components/widgets/term.svelte';
import TransactionKinds from '$lib/components/widgets/transaction-kinds.svelte';
import VoucherClasses from '$lib/components/widgets/voucher-classes.svelte';

export const componentList = [
  {
    name: 'Approve',
    title: '承認待ち',
    defaultW: 12,
    defaultH: 28,
    authority: (user, options) => {
      return (user?.approvable);
    },
    component: Approve
  }, {
    name: 'Backup',
    title: 'バックアップ',
    defaultW: 7,
    defaultH: 36,
    authority: (user, options) => {
      return (user?.administrable);
    },
    component: Backup
  }, {
    name: 'FormPrint',
    title: '帳票出力',
    defaultW: 4,
    defaultH: 38,
    authority: (user, options) => {
      return (user?.accounting || user?.fiscal_browsing);
    },
    component: FormPrint
  }, {
    name: 'Password',
    title: 'パスワード変更',
    defaultW: 5,
    defaultH: 36,
    component: Password
  }, {
    name: 'SelectTerm',
    title: '年度選択',
    defaultW: 8,
    defaultH: 42,
    component: SelectTerm
  }, {
    name: 'CompanyKinds',
    title: '取引先種別',
    defaultW: 6,
    defaultH: 40,
    authority: (user, options) => {
      return (user?.administrable);
    },
    component: CompanyKinds,
  }, {
    name: 'TransactionKinds',
    title: '取引文書種別',
    defaultW: 6,
    defaultH: 40,
    authority: (user, options) => {
      return (user?.administrable);
    },
    component: TransactionKinds,
  }, {
    name: 'VoucherClasses',
    title: '証憑種別',
    defaultW: 6,
    defaultH: 40,
    authority: (user, options) => {
      return (user?.administrable);
    },
    component: VoucherClasses,
  }, {
    name: 'ItemClasses',
    title: '品目種別',
    defaultW: 6,
    defaultH: 40,
    authority: (user, options) => {
      return (user?.administrable);
    },
    component: ItemClasses,
  }, {
    name: 'MemberClasses',
    title: '役職員種別',
    defaultW: 6,
    defaultH: 40,
    authority: (user, options) => {
      return (user?.administrable);
    },
    component: MemberClasses,
  }, {
    name: 'HTMLPanel',
    title: 'メモ',
    defaultW: 6,
    defaultH: 40,
    component: HTMLPanel,
  }, {
    name: 'MenuLink',
    defaultW: 3,
    defaultH: 23,
    authority: (user, options) => {
      return (options?.authority ? options.authority(user) : true);
    },
    component: MenuLink,
    create: createMenuLink,
    activate: activateMenuLink
  }, {
    name: 'Bookmark',
    defaultW: 4,
    defaultH: 40,
    authority: (user, options) => {
      return (options?.authority ? options.authority(user) : true);
    },
    component: Bookmark,
    create: createBookmark,
    activate: activateBookmark
  }
];

export const findComponent = (name) => {
  return componentList.find((ent) => {
    return (ent.name === name);
  });
};