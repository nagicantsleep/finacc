## Bilingual Migration Complete: `bank-ledger.svelte`

### Changes Made

1. **Added import** (line 174):
   ```js
   import BilingualText from '../../components/bilingual-text.svelte';
   ```

2. **Replaced 3 hardcoded Japanese texts** with `<BilingualText>` components:

   | Original | Replacement | Locale Key |
   |----------|-------------|------------|
   | `銀行元帳` (page title) | `<BilingualText key="bank_ledger" />` | `bank_ledger` |
   | `補助科目` (column header) | `<BilingualText key="sub_account" />` | `sub_account` |
   | `残高` (column header) | `<BilingualText key="balance" />` | `balance` |

3. **Kept as-is** (no matching key in `ja.json`): 科目, 伝票入力, 当座預金, 普通預金, 定期預金, 定期積立, 日付/伝番, 相手勘定科目, 相手補助科目, 適用, 支払金額, 預り金額 — ready for next-pass migration once keys are added to the locale file.

4. **Zero logic changes** — all event handlers, reactive statements, API calls, and data bindings preserved exactly.
