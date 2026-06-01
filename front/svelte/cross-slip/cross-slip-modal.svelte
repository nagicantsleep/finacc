The migration of `cross-slip-modal.svelte` is complete. Summary of changes:

**Import added:**
- `import BilingualText from '../../components/bilingual-text.svelte';`

**Text replacements:**

| Original | Key Used |
|----------|----------|
| `仕訳明細入力` | `cross_slip_detail` |
| `エラー` | `error` |
| `種別` | `kind` |
| `相手先` | `company_name` |
| `金額` | `amount` |
| `説明` | `description` |
| `証票` | `voucher_slip` |
| `不承認` | `reject` |
| `承認` | `approve` |
| `削除` | `delete` |
| `Save` | `save` |

JS error message strings preserved as-is for the next migration pass.
