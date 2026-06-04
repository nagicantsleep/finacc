<!--
  BilingualText — renders text in a stacked bilingual layout.
  Primary language on top (bold), secondary below (smaller, muted).
  Set `stacked={false}` to render a single line "primary / secondary"
  (or just one value when both languages resolve to the same string).
  Useful for compact headers and table <th> cells where the stacked
  layout would overlap.

  Props:
    key       — dictionary key, auto-resolves both languages
    primary   — override primary text (alternative to key)
    secondary — override secondary text (alternative to key)
    inline    — use inline-flex (default: inline-block)
    stacked   — render primary on top of secondary (default: true).
                When false, render on a single line: "p / s" or just "p".
-->
{#if stacked}
<span
  class="bilingual-text"
  style="display:{inline ? 'inline-flex' : 'flex'};flex-direction:column;line-height:1.4;vertical-align:middle"
>
  <span class="bilingual-primary" style="font-weight:600;line-height:1.4">{_primary}</span>
  <span class="bilingual-secondary" style="font-size:0.78em;line-height:1.25">{_secondary}</span>
</span>
{:else}
<span class="bilingual-text bilingual-inline" style="display:{inline ? 'inline-flex' : 'inline-flex'};align-items:baseline;gap:0.25em;white-space:nowrap">
  {#if _primary === _secondary}
    <span class="bilingual-primary" style="font-weight:600">{_primary}</span>
  {:else}
    <span class="bilingual-primary" style="font-weight:600">{_primary}</span>
    <span class="bilingual-sep">/</span>
    <span class="bilingual-secondary" style="font-size:0.85em">{_secondary}</span>
  {/if}
</span>
{/if}

<script>
  import { languagePair } from '../../javascripts/bilingual.js';

  /** @type {string|undefined} */
  export let key = undefined;
  /** @type {string|undefined} */
  export let primary = undefined;
  /** @type {string|undefined} */
  export let secondary = undefined;
  /** @type {boolean} */
  export let inline = false;
  /** @type {boolean} */
  export let stacked = true;

  // Dictionaries are loaded in index.svelte via loadDictionaries(),
  // stored in a module-level variable in bilingual.js. Here we access
  // them through the imports that were done there.

  // The dictionaries are accessed through a module-scope cache.
  // Import the individual locale files for direct lookup.
  import jaDict from '../../javascripts/locales/ja.json';
  import viDict from '../../javascripts/locales/vi.json';
  import enDict from '../../javascripts/locales/en.json';

  const DICT = { ja: jaDict, vi: viDict, en: enDict };

  // Reactive: re-derive display text when languagePair or props change
  $: _primary = computePrimary($languagePair, key, primary);
  $: _secondary = computeSecondary($languagePair, key, secondary);

  function computePrimary(pair, k, override) {
    if (override !== undefined) return override;
    const dict = DICT[pair.primary] || {};
    return dict[k] ?? k ?? '';
  }

  function computeSecondary(pair, k, override) {
    if (override !== undefined) return override;
    const dict = DICT[pair.secondary] || {};
    return dict[k] ?? k ?? '';
  }
</script>
