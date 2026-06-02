{#if (messages.length > 0) }
<div class="border rounded border-danger mb-2 ms-2 me-2 p-3">
  <h5 class="fs-5 text-danger"><i class="bi bi-exclamation-triangle-fill"></i><BilingualText key="error_space" /></h5>
  <ul>
    {#each messages as message}
      <li class="text-danger">{message}</li>
    {/each}
  </ul>
</div>
{/if}

<script>
import BilingualText from '../components/bilingual-text.svelte';
export let messages;
</script>