<script>
  import { onMount } from 'svelte';
  import RegistryList from './registry-list.svelte';
  import RegistryDataGrid from './registry-data-grid.svelte';
  import RegistryDesignerModal from './registry-designer-modal.svelte';
  import RegistryEntryModal from './registry-entry-modal.svelte';

  export let initialData = null;
  export let status = null;

  let currentView = 'list'; // 'list' | 'grid'
  let selectedDefinition = null;

  let listComponent;
  let gridComponent;

  // Modals state
  let isDesignerOpen = false;
  let designerDefinition = null;

  let isEntryModalOpen = false;
  let activeEntryId = null;

  function handleSelectRegistry(e) {
    selectedDefinition = e.detail.definition;
    currentView = 'grid';
  }

  function handleEditDesigner(e) {
    designerDefinition = e.detail.definition;
    isDesignerOpen = true;
  }

  function handleOpenEntry(e) {
    activeEntryId = e.detail.entryId;
    isEntryModalOpen = true;
  }

  function handleDesignerSaved() {
    if (listComponent) listComponent.loadDefinitions();
    if (selectedDefinition && gridComponent) gridComponent.loadEntries();
  }

  function handleEntrySaved() {
    if (gridComponent) gridComponent.loadEntries();
    if (listComponent) listComponent.loadDefinitions();
  }
</script>

<div class="registry-module">
  {#if currentView === 'list'}
    <RegistryList
      bind:this={listComponent}
      initialData={initialData}
      on:selectRegistry={handleSelectRegistry}
      on:editDesigner={handleEditDesigner}
    />
  {:else if currentView === 'grid'}
    <RegistryDataGrid
      bind:this={gridComponent}
      definition={selectedDefinition}
      on:back={() => { currentView = 'list'; }}
      on:openEntry={handleOpenEntry}
    />
  {/if}

  <!-- Designer Modal -->
  <RegistryDesignerModal
    definition={designerDefinition}
    bind:isOpen={isDesignerOpen}
    on:saved={handleDesignerSaved}
  />

  <!-- Entry / CRM Timeline Modal -->
  <RegistryEntryModal
    definition={selectedDefinition}
    entryId={activeEntryId}
    bind:isOpen={isEntryModalOpen}
    on:saved={handleEntrySaved}
  />
</div>
