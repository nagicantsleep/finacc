<script>
  import { bi } from '$lib/i18n/bilingual.js';
  import MemberView from '$lib/components/member/member.svelte';

  export let data;

  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'member',
    pathname: '/member'
  };
</script>

<svelte:head>
  <title>{$bi('title_member')} :: Hieronymus</title>
</svelte:head>

<div class="member-page container-fluid px-0">
  <MemberView bind:status initialData={data} />
</div>
