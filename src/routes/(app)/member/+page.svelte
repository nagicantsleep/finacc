<script>
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
  <title>役職員・メンバー :: Hieronymus</title>
</svelte:head>

<div class="member-page container-fluid px-0">
  <MemberView bind:status />
</div>
