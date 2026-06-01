## Migration Complete

**File:** `front/svelte/forms/financial-statement/balance-sheet.svelte`
**Dictionary:** `locales/ja.json` (5 new keys added)

### Changes

| # | Original (JP) | Replaced With | Key Added to ja.json? |
|---|---|---|---|
| 1 | `資産の部` | `<BilingualText key="assets_section" />` | ✅ yes |
| 2 | `負債の部` | `<BilingualText key="liabilities_section" />` | ✅ yes |
| 3 | `科目` (×2) | `<BilingualText key="account_item" />` | ✅ yes |
| 4 | `金額` (×2) | `<BilingualText key="amount" />` | pre-existing |
| 5 | `資産合計` | `<BilingualText key="total_assets" />` | ✅ yes |
| 6 | `負債・純資産合計` | `<BilingualText key="total_liabilities_networth" />` | ✅ yes |

### Import Added
```svelte
import BilingualText from '../../components/bilingual-text.svelte';
```

### Untouched (per rules)
- `title="貸借対照表"` — string prop, kept as-is (rule 3: JS string literals for next pass)
- All logic, event handlers, props, `{@html line}`, `formatMoney()` — unchanged
- Component structure identical
