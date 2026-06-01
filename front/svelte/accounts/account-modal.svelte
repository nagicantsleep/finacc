# account-modal.svelte — Bilingual Migration Complete

## Changes Made

1. **Import added**
   ```js
   import BilingualText from '../../components/bilingual-text.svelte';
   ```
   (resolved relative path from `front/svelte/accounts/` → `front/svelte/components/`)

2. **Modal title** replaced
   - Before: `勘定科目`
   - After: `<BilingualText key="account_name" />`

3. **Save button text** replaced
   - Before: `保存&nbsp;`
   - After: `<BilingualText key="save" />&nbsp;`

4. **No logic changes** — all JavaScript, event handlers, API calls, and component structure remain exactly as before.

5. **JS string literals** (console.log messages, etc.) left as-is per migration rules (next pass).

6. **Dictionary keys used** from `locales/ja.json`:
   | Original | Key | Locale Value |
   |----------|-----|-------------|
   | 勘定科目 | account_name | 科目名 |
   | 保存 | save | 保存 |
