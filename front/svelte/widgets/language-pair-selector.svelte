<!--
  LanguagePairSelector — compact dropdown for the top navbar.

  Renders the current pair as "日本語/Tiếng Việt" (primary self-name / secondary self-name)
  using lang_ja/lang_vi/lang_en keys. Pair options are hardcoded as
  (primary, secondary) tuples so each option's display is independent of
  the current $languagePair.

  Props: none (reads/writes languagePair store + calls API)
-->
<div class="d-flex align-items-center" style="font-size:0.85rem; padding: 0 0.5rem;">
  <select class="form-select form-select-sm" style="width:auto; min-width:120px;" bind:value={selectedPair} title={currentLabel}>
    {#each optionLabels as opt}
      <option value="{opt.value}">{opt.label}</option>
    {/each}
  </select>
</div>

<script>
  import axios from 'axios';
  import { languagePair } from '../../javascripts/bilingual.js';
  import ja from '../../javascripts/locales/ja.json';
  import vi from '../../javascripts/locales/vi.json';
  import en from '../../javascripts/locales/en.json';

  const DICT = { ja, vi, en };

  // Self-name of each language, rendered in its own script
  // (日本語, Tiếng Việt, English) — looked up in that language's own dict.
  const LANG_SELF = { ja: 'lang_ja', vi: 'lang_vi', en: 'lang_en' };
  function selfName(lang) {
    return DICT[lang]?.[LANG_SELF[lang]] ?? lang;
  }

  // Hardcoded pair options so the dropdown label is independent of $languagePair.
  // Each option shows "primary-self / secondary-self" (e.g. 日本語/Tiếng Việt).
  const PAIR_OPTIONS = [
    { value: 'ja,vi', primary: 'ja', secondary: 'vi' },
    { value: 'vi,ja', primary: 'vi', secondary: 'ja' },
    { value: 'ja,en', primary: 'ja', secondary: 'en' },
    { value: 'en,ja', primary: 'en', secondary: 'ja' },
    { value: 'vi,en', primary: 'vi', secondary: 'en' },
    { value: 'en,vi', primary: 'en', secondary: 'vi' }
  ];

  // Build the option labels (e.g. "日本語/Tiếng Việt") once. Each option's
  // label is independent of $languagePair — self-names come from each
  // language's own dictionary.
  const optionLabels = PAIR_OPTIONS.map((opt) => ({
    value: opt.value,
    label: `${selfName(opt.primary)}/${selfName(opt.secondary)}`
  }));

  let selectedPair = 'ja,vi';
  // Tracks the last pair value that has been synced to/from the store.
  // Used to break the reactive feedback loop between `selectedPair` and
  // `$languagePair` (e.g. when index.svelte fetches the persisted pair
  // from /api/user/language-pair on init).
  let lastSyncedPair = 'ja,vi';

  // External store -> dropdown (e.g. server fetch on init)
  $: if ($languagePair) {
    const fromStore = `${$languagePair.primary},${$languagePair.secondary}`;
    if (fromStore !== lastSyncedPair) {
      lastSyncedPair = fromStore;
      if (selectedPair !== fromStore) {
        selectedPair = fromStore;
      }
    }
  }

  // Title for the <select> element: shows the current selection in compact form.
  $: currentLabel = (() => {
    const opt = optionLabels.find((o) => o.value === selectedPair);
    return opt ? opt.label : '';
  })();

  // Dropdown -> store (user click). Reactive statement with lastSyncedPair
  // guard fires exactly once per user selection; avoids the bind:value +
  // on:change race where on:change could fire before bind:value updated
  // selectedPair (causing languagePair.set with the previous value).
  $: if (selectedPair && selectedPair !== lastSyncedPair) {
    lastSyncedPair = selectedPair;
    const [primary, secondary] = selectedPair.split(',');
    const newPair = { primary, secondary };
    languagePair.set(newPair);
    axios.put('/api/user/language-pair', newPair).catch((e) => {
      console.log('Failed to persist language pair', e);
    });
  }
</script>
