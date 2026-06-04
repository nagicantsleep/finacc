<ul class="page-subtitle nav">
  {#each fields as field, index}
  <li class="nav-item dropdown pe-2">
    <button type="button" class="btn btn-outline-primary dropdown-toggle"
      id="field_{index}"
      rolw="button"
      data-bs-toggle="dropdown" aria-expanded="false">
      <BilingualText key={field.titleKey} inline={true} />
    </button>
    <ul class="dropdown-menu" aria-labelledby="field_{index}">
      {#each field.accounts as account}
      <li>
        <button type="button" class="dropdown-item btn btn-link"
          on:click={() => {
            select(account.code);
          }}><BilingualText primary={account.name} secondary={account.nameVi} inline={true} /></button>
      </li>
      {/each}
    </ul>
  </li>
  {/each}
</ul>
<script>
import {createEventDispatcher} from 'svelte';
import BilingualText from './bilingual-text.svelte';

const dispatch = createEventDispatcher();

export let fields;

const select = (code) => {
  dispatch('select', {
    code: code
  });
}

</script>
