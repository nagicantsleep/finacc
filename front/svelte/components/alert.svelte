<div class="">
    {#if alert}
    <div class="p-3 mt-3 alert fade show alert-{alert_level}" role="alert">
        <button type="button" class="btn-close pr-2" aria-label="Close"
            on:click="{() => {alert = undefined}}"><BilingualText key="close" /></button>
        <strong>{alert}</strong>
    </div>
    {/if}
</div>
<script>
import BilingualText from '../../components/bilingual-text.svelte';
export let alert;
export let alert_level;
</script>
