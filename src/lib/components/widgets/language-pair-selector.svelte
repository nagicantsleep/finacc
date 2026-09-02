<!--
  LanguagePairSelector — compact bilingual pair control.

  Closed state: primary flag, swap, secondary flag.
  Click a flag to replace that one language (the other side is excluded).
  Swap flips primary/secondary immediately.

  Props:
    save — persist pick via PUT /api/user/language-pair (default true)
    tone — "navbar" for dark header, "card" for white login/signup card
-->
<div
  class="language-pair-root"
  class:tone-navbar={tone === 'navbar'}
  class:tone-card={tone === 'card'}
  bind:this={rootEl}
>
  <div class="language-pair-control" role="group" aria-label={currentLabel}>
    <button
      type="button"
      class="flag-slot"
      bind:this={primaryBtn}
      title={selfName(currentPrimary)}
      aria-label={selfName(currentPrimary)}
      aria-haspopup="listbox"
      aria-expanded={openSlot === 'primary'}
      on:click={() => toggleSlot('primary')}
    >
      <span class="flag-primary" aria-hidden="true">
        <Icon icon={FLAG_ICON[currentPrimary]} width="18" />
      </span>
    </button>

    <button
      type="button"
      class="swap-btn"
      title={swapLabel}
      aria-label={swapLabel}
      on:click|stopPropagation={swapLanguages}
    >
      <i class="bi bi-arrow-left-right" aria-hidden="true"></i>
    </button>

    <button
      type="button"
      class="flag-slot"
      bind:this={secondaryBtn}
      title={selfName(currentSecondary)}
      aria-label={selfName(currentSecondary)}
      aria-haspopup="listbox"
      aria-expanded={openSlot === 'secondary'}
      on:click={() => toggleSlot('secondary')}
    >
      <span class="flag-secondary" aria-hidden="true">
        <Icon icon={FLAG_ICON[currentSecondary]} width="16" />
      </span>
    </button>
  </div>

  {#if openSlot}
    <ul
      class="language-pair-menu"
      style={menuStyle}
      role="listbox"
      aria-label={openSlot === 'primary' ? selfName(currentPrimary) : selfName(currentSecondary)}
    >
      {#each slotOptions as lang (lang)}
        <li>
          <button
            type="button"
            class="menu-lang"
            class:active={lang === (openSlot === 'primary' ? currentPrimary : currentSecondary)}
            role="option"
            aria-selected={lang === (openSlot === 'primary' ? currentPrimary : currentSecondary)}
            title={selfName(lang)}
            aria-label={selfName(lang)}
            on:click={() => pickLang(openSlot, lang)}
          >
            <Icon icon={FLAG_ICON[lang]} width="20" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .language-pair-root {
    position: relative;
    display: inline-flex;
    padding: 0 0.35rem;
  }

  .language-pair-control {
    display: inline-flex;
    align-items: center;
    border-radius: 0.375rem;
    border: 1px solid transparent;
    line-height: 1;
  }

  .tone-navbar .language-pair-control {
    background-color: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.35);
    color: #fff;
  }

  .tone-card .language-pair-control {
    background-color: #f8f9fa;
    border-color: #ced4da;
    color: #212529;
  }

  .flag-slot,
  .swap-btn,
  .menu-lang {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    line-height: 1;
  }

  .flag-slot {
    padding: 0.22rem 0.35rem;
  }

  .flag-primary {
    display: inline-flex;
  }

  .flag-secondary {
    display: inline-flex;
    opacity: 0.78;
  }

  .swap-btn {
    width: 1.35rem;
    height: 1.35rem;
    border-radius: 50%;
    font-size: 0.72rem;
    opacity: 0.85;
  }

  .tone-navbar .swap-btn:hover,
  .tone-navbar .flag-slot:hover {
    background-color: rgba(255, 255, 255, 0.16);
  }

  .tone-card .swap-btn:hover,
  .tone-card .flag-slot:hover {
    background-color: #e9ecef;
  }

  .language-pair-menu {
    position: fixed;
    z-index: 2000;
    margin: 0;
    padding: 0.25rem 0;
    list-style: none;
    min-width: 2.75rem;
    background: #fff;
    color: #212529;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  }

  .menu-lang {
    width: 100%;
    padding: 0.4rem 0.55rem;
  }

  .menu-lang:hover {
    background-color: #f8f9fa;
  }

  .menu-lang.active {
    background-color: var(--bs-primary-bg-subtle, #e7f1ff);
  }

  @media (max-width: 767.98px) {
    .language-pair-root {
      padding: 0 0.15rem;
    }

    .flag-slot {
      padding: 0.16rem 0.28rem;
    }
  }
</style>

<script>
  import { onMount, tick } from 'svelte';
  import axios from 'axios';
  import Icon from '@iconify/svelte';
  import { languagePair } from '$lib/i18n/bilingual.js';
  import ja from '$lib/i18n/locales/ja.json';
  import vi from '$lib/i18n/locales/vi.json';
  import en from '$lib/i18n/locales/en.json';

  export let save = true;
  export let tone = 'navbar';

  const DICT = { ja, vi, en };
  const LANG_SELF = { ja: 'lang_ja', vi: 'lang_vi', en: 'lang_en' };
  const FLAG_ICON = { ja: 'circle-flags:jp', vi: 'circle-flags:vn', en: 'circle-flags:us' };
  const LANGS = ['ja', 'vi', 'en'];

  function selfName(lang) {
    return DICT[lang]?.[LANG_SELF[lang]] ?? lang;
  }

  let rootEl;
  let primaryBtn;
  let secondaryBtn;
  let menuStyle = '';
  let openSlot = null;
  let selectedPair = 'ja,vi';
  let lastSyncedPair = 'ja,vi';
  let currentPrimary = 'ja';
  let currentSecondary = 'vi';

  $: if ($languagePair) {
    const fromStore = `${$languagePair.primary},${$languagePair.secondary}`;
    if (fromStore !== lastSyncedPair) {
      lastSyncedPair = fromStore;
      if (selectedPair !== fromStore) {
        selectedPair = fromStore;
      }
    }
  }

  $: {
    const parts = selectedPair.split(',');
    currentPrimary = parts[0];
    currentSecondary = parts[1];
  }
  $: currentLabel = `${selfName(currentPrimary)}/${selfName(currentSecondary)}`;
  $: swapLabel = `${selfName(currentSecondary)} / ${selfName(currentPrimary)}`;
  $: slotOptions = LANGS.filter((lang) =>
    lang !== (openSlot === 'primary' ? currentSecondary : currentPrimary)
  );

  async function positionMenu(slot) {
    await tick();
    const el = slot === 'primary' ? primaryBtn : secondaryBtn;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    menuStyle = `top:${rect.bottom + 4}px;left:${rect.left + rect.width / 2}px;transform:translateX(-50%);`;
  }

  async function toggleSlot(slot) {
    if (openSlot === slot) {
      openSlot = null;
      return;
    }
    openSlot = slot;
    await positionMenu(slot);
  }

  function closeMenu() {
    openSlot = null;
  }

  function swapLanguages() {
    selectedPair = `${currentSecondary},${currentPrimary}`;
    closeMenu();
  }

  function pickLang(slot, lang) {
    if (slot === 'primary') {
      if (lang === currentPrimary) {
        closeMenu();
        return;
      }
      selectedPair = `${lang},${currentSecondary}`;
    } else {
      if (lang === currentSecondary) {
        closeMenu();
        return;
      }
      selectedPair = `${currentPrimary},${lang}`;
    }
    closeMenu();
  }

  function handleDocumentClick(event) {
    if (openSlot && rootEl && !rootEl.contains(event.target)) {
      closeMenu();
    }
  }

  function handleDocumentKeydown(event) {
    if (openSlot && event.key === 'Escape') {
      closeMenu();
    }
  }

  onMount(() => {
    const reposition = () => {
      if (openSlot) positionMenu(openSlot);
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeydown);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleDocumentKeydown);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  });

  $: if (selectedPair && selectedPair !== lastSyncedPair) {
    lastSyncedPair = selectedPair;
    const [primary, secondary] = selectedPair.split(',');
    const newPair = { primary, secondary };
    languagePair.set(newPair);
    if (save) {
      axios.put('/api/user/language-pair', newPair).catch((e) => {
        console.log('Failed to persist language pair', e);
      });
    }
  }
</script>
