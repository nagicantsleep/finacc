<div class="container">
  <div class="d-flex justify-content-end text-muted small">
    <div>ver {version}</div>
  </div>
</div>

<script>
  import { onMount } from 'svelte';
  import axios from 'axios';

  let version = "2.0.7";

  onMount(async () => {
    try {
      const result = await axios.get('/api/version');
      if (result.data && result.data.version) {
        version = result.data.version;
      }
    } catch (e) {
      // fallback to 2.0.7
    }
  });
</script>
