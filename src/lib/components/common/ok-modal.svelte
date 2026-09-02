<div class="modal" bind:this={modalEl} tabindex="-1" data-bs-backdrop="static">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="modal-label">{title}</h5>
        <button type="button" class="btn-close" id="close-button" aria-label="Close"
          on:click={close_}></button>
      </div>
      <div class="modal-body">
        <p>{@html description}</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-danger"
          on:click={() => { Answer(true)}} ><BilingualText key="yes" /></button>
        <button type="button" class="btn btn-primary"
          on:click={() => { Answer(false)}}><BilingualText key="no" /></button>
      </div>
    </div>
  </div>
</div>

<script>
import { onMount, createEventDispatcher } from 'svelte';
import BilingualText from '$lib/components/BilingualText.svelte';
const dispatch = createEventDispatcher();

export let title = '';
export let description = '';

let modalEl;
let modal;

export const show = () => {
  if (modal) {
    modal.show();
  } else if (modalEl) {
    import('bootstrap').then((bs) => {
      modal = new bs.Modal(modalEl);
      modal.show();
    });
  }
};

const Answer = (answer) => {
  modal?.hide();
  dispatch('answer', answer);
};

const close_ = () => {
  modal?.hide();
};

onMount(async () => {
  if (typeof window !== 'undefined') {
    try {
      const bs = await import('bootstrap');
      modal = new bs.Modal(modalEl);
    } catch (e) {
      console.error(e);
    }
  }
});
</script>