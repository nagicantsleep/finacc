<div class="container">
  <div class="d-flex justify-content-between">
    <div>
      <strong>Copyright &copy; 2020-2024 <a href="https://www.wasp.co.jp/">WASP Co LTD</a>.</strong><br/>
      <strong>Copyright &copy; 2024 <a href="https://www.beesnest-inc.com/">BeesNest LLC</a>.</strong>
      All rights reserved.
    </div>
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
