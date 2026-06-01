Migration of `front/svelte/project/project-entry.svelte` to bilingual text is complete.

**Changes made:**

1. Added `import BilingualText from '../components/bilingual-text.svelte';`
2. Replaced 7 hardcoded Japanese text nodes with `<BilingualText key="..." />` components:
   - `プロジェクト名` → `key="project_name"`
   - `コード` → `key="project_code"`
   - `開始日` → `key="start_date"`
   - `終了日` → `key="end_date"`
   - `削除` → `key="delete"`
   - `もどる` → `key="back"`
   - `保存` → `key="save"`

**Preserved as-is (per rules):**
- Page title `プロジェクト情報` (no existing common key)
- Button labels `集計設定` / `集計表示` (no existing locale keys)
- All JS string literals (console.error, alert, confirm messages)
- All logic, event handlers, bindings, component structure
