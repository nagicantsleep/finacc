<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import WorkspaceView from '$lib/components/workspace/workspace.svelte';
  import Toast from '$lib/components/common/Toast.svelte';

  export let data;

  let toast;
  let status = {
    user: data.user || { administrable: true, accounting: true },
    fy: data.currentFy,
    tenant: data.tenant,
    current: 'workspace',
    pathname: '/workspace'
  };

</script>

<svelte:head>
  <title>ワークスペース :: Hieronymus</title>
</svelte:head>

<div class="menu-page container-fluid px-0">
  <WorkspaceView bind:status bind:toast />
  <Toast bind:toast />
</div>
