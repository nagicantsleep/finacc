<!--
  LanguagePairSelector — compact dropdown for the top navbar.

  Renders the current pair as "日本語/Tiếng Việt" (primary self-name / secondary self-name)
  using lang_ja/lang_vi/lang_en keys. Pair options are hardcoded as
  (primary, secondary) tuples so each option's display is independent of
  the current $languagePair.

  Props: none (reads/writes languagePair store + calls API)
-->
<div class="d-flex align-items-center" style="font-size:0.85rem; padding: 0 0.5rem;">
  <select class="form-select form-select-sm" style="width:auto; min-width:120px;" bind:value={selectedPair} on:change={onChange} title={currentLabel}>
    {#each PAIR_OPTIONS as opt}
      <option value="{opt.value}">{opt.label}</option>
    {/each}
  </select>
</div>

<script>
  import axios from 'axios';
  import { _bDerived, languagePair } from '../../javascripts/bilingual.js';
  import ja from '../../javascripts/locales/ja.json';
  import vi from '../../javascripts/locales/vi.json';
  import en from '../../javascripts/locales/en.json';

  const DICT = { ja, vi, en };

  // Self-name of each language (always shown in its own form: 日本語, Tiếng Việt, English).
  const LANG_SELF = { ja: 'lang_ja', vi: 'lang_vi', en: 'lang_en' };

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

  // Simple local lookup for the selector labels
  function _b(key) {
    const pair = $languagePair || { primary: 'ja', secondary: 'vi' };
    const pd = DICT[pair.primary] || {};
    const sd = DICT[pair.secondary] || {};
    return { primary: pd[key] ?? key, secondary: sd[key] ?? key };
  }

  // Build the option labels (e.g. "日本語/Tiếng Việt") once.
  $: optionLabels = PAIR_OPTIONS.map((opt) => {
    const pKey = LANG_SELF[opt.primary];
    const sKey = LANG_SELF[opt.secondary];
    return {
      value: opt.value,
      label: `${_b(pKey).primary}/${_b(sKey).primary}`
    };
  });

  let selectedPair = 'ja,vi';

  // Sync dropdown to store on init
  $: if ($languagePair) {
    selectedPair = `${$languagePair.primary},${$languagePair.secondary}`;
  }

  // Title for the <select> element: shows the current selection in compact form.
  $: currentLabel = (() => {
    const opt = optionLabels.find((o) => o.value === selectedPair);
    return opt ? opt.label : '';
  })();

  async function onChange() {
    const [primary, secondary] = selectedPair.split(',');
    const newPair = { primary, secondary };
    languagePair.set(newPair);

    try {
      await axios.put('/api/user/language-pair', newPair);
    } catch (e) {
      console.log('Failed to persist language pair', e);
    }
  }
</script>
