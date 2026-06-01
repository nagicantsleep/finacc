<!--
  LanguagePairSelector — dropdown in sidebar for selecting language pair.

  Props: none (reads/writes languagePair store + calls API)
-->
<div class="p-2 border-top" style="margin-top:auto">
  <label class="form-label small text-muted mb-1" style="font-size:0.75rem">
    {$_b('language_pair').primary}<br>
    <span style="font-size:0.7rem">{$_b('language_pair').secondary}</span>
  </label>
  <select class="form-select form-select-sm" bind:value={selectedPair} on:change={onChange}>
    <option value="ja,vi">{$_b('language_pair_ja_vi').primary}<br>{$_b('language_pair_ja_vi').secondary}</option>
    <option value="vi,ja">{$_b('language_pair_vi_ja').primary}<br>{$_b('language_pair_vi_ja').secondary}</option>
    <option value="ja,en">{$_b('language_pair_ja_en').primary}<br>{$_b('language_pair_ja_en').secondary}</option>
    <option value="en,ja">{$_b('language_pair_en_ja').primary}<br>{$_b('language_pair_en_ja').secondary}</option>
  </select>
</div>

<script>
  import axios from 'axios';
  import { _bDerived, languagePair } from '../../javascripts/bilingual.js';
  import ja from '../../javascripts/locales/ja.json';
  import vi from '../../javascripts/locales/vi.json';
  import en from '../../javascripts/locales/en.json';

  const DICT = { ja, vi, en };

  // Simple local lookup for the selector labels
  function _b(key) {
    const pair = $languagePair || { primary: 'ja', secondary: 'vi' };
    const pd = DICT[pair.primary] || {};
    const sd = DICT[pair.secondary] || {};
    return { primary: pd[key] ?? key, secondary: sd[key] ?? key };
  }

  let selectedPair = 'ja,vi';

  // Sync dropdown to store on init
  $: if ($languagePair) {
    selectedPair = `${$languagePair.primary},${$languagePair.secondary}`;
  }

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
