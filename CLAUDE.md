<!-- SYNC NOTICE: CLAUDE.md and AGENTS.md share identical workflow content. Edit BOTH together.
     Tool-managed blocks (<!-- gitnexus:* -->, <!-- HARNESS:* -->) are regenerated into only ONE
     file by their tools (GitNexus → CLAUDE.md, Harness installer → AGENTS.md). After running those
     tools, manually re-sync the other file. -->

# AI Agent Instructions

## Project Context

- **Overview:** `kaikei` — accounting / financial web application (v2.0.7). Multi-tenant foundation landed on `main` (see `epic/multitenant-foundation`).
- **Tech Stack:** Svelte 4 + Vite 5 (frontend, SSR via `vite.config.ssr.js`, routing via `@roxi/routify`), Express 4 (backend), Sequelize 6 + PostgreSQL (`pg`), Passport local auth, ESM (`"type": "module"`).
- **Structure:** `front/` `views/` `routes/` `models/` `migrations/` `config/` `libs/` `bin/` (server entry `bin/www`) `public/` `batch/` `forms/` `test/` (mocha) `docs/` (harness operating docs) `scripts/` (harness CLI).
- **Core Flow:** HTTP request → Express route (`routes/`) → Sequelize model (`models/`) → PostgreSQL. Svelte UI is built by Vite and served by Express.
- **Conventions:** ESM modules; env via `dotenv` (`.env`, never commit); sessions via `connect-pg-simple` / `session-file-store`; path/state per existing modules.
- **Commands:** install `npm install` | build `npm run build` (vite) | dev `npm run dev` | start `npm start` | test `npm test` (mocha). No `lint` script is configured — do not invoke `npm run lint`.

---

## 1. Git & Issue Conventions (MANDATORY)

**All code changes MUST be driven by a GitHub issue.** Create the issue first,
then work on a branch cut from the current `epic/<name>` branch (if one exists)
or from `main`. Agents must not make code changes without an existing issue.
No exception.

<!-- HARNESS-INTEGRATION:BEGIN -->
### Harness Layer (composes with this issue workflow)

This repo also uses the Harness framework (`scripts/bin/harness-cli.exe`, docs in
`docs/HARNESS.md`). It adds risk-lane classification and proof discipline on top
of the issue workflow. The two layers compose; they do not replace each other.

- **GitHub issue stays the canonical, shared source of truth.** The MANDATORY
  issue gate above always applies. `harness.db` is `.gitignore`d and local-only,
  so harness intake/trace/matrix records are a per-machine logbook — never the
  shared record. Only committed `docs/stories/*.md` are shared harness artifacts.
- **Gate order:** create the GitHub issue first, then run `harness-cli intake`
  to classify the lane (`tiny | normal | high-risk`). Intake is a sub-step after
  the issue exists, not a bypass of it.
- **ID mapping:** key harness records to the issue number
  (`harness-cli story add --id <issue#> ...`) so `query matrix` and the issue
  cross-reference.
- **Epic mapping:** git `epic/<name>` branch ↔ GitHub `epic:<name>` label ↔
  harness story folder / initiative notes.
- **Proof written once:** author the Test Report once, post to the issue (shared)
  and record the same outcome in harness matrix/trace (local).
- **Branch & commit conventions in this file win.** Harness has no opinion on git.
- A harness `tiny` lane drops heavy story/docs ceremony, NOT the issue gate.
<!-- HARNESS-INTEGRATION:END -->

- **Branching:** `feature/<issue-#>-<desc>`, `fix/<issue-#>-<desc>`, `epic/<name>`.
- **Commits:** `type(#issue): short desc` (Types: feat, fix, refactor, docs, chore).
- **Labels:** Use available labels; `epic:<name>` for epics.
- **NEVER:** Commit environment variables, local storage, or secrets.
- **NEVER:** Use `git add -A` or `git add .` (always stage specific files explicitly).
- **NEVER:** Push directly to `main`. All merges to `main` go through `gh pr create`.

## 2. When to Create an Issue (and When Not To)

| User Request | Action |
| --- | --- |
| "Fix bug X", "Add feature Y", "Refactor Z", "Update styling of component X" | Code changes → **Create issue first**, then implement. |
| "Explain code {A}", "Summarize project/business/workflow {B}", "Consult approach {C}" | Q&A / brainstorming → ❌ No issue needed. |
| "Check list", "Update documentation" | Planning / documenting only → ❌ No issue needed. |

## 3. Issue Standards

Create issues via `gh issue create` before coding.
**Required Structure:**

```md
### Description & Requirements

[What, why, technical details, files to modify]

### Dependencies

Requires: #XX | Part of: epic:name

### Acceptance Criteria

- [ ] Specific, verifiable deliverable 1 (no vague "works correctly")
- [ ] Specific, verifiable deliverable X (no vague "works correctly")
- [ ] Equivalent test/verify command
```

## 4. Workflow Phases

### Phase 1: Research & Intake

- `gh issue view <issue-#>`
- Read dependencies and related epics (`gh issue list --label "epic:<name>"`). Ask the user if unclear.
- Classify the harness risk lane (after the issue exists):
  ```bash
  scripts/bin/harness-cli.exe intake --type "<input-type>" --summary "<text>" --lane <tiny|normal|high-risk>
  ```
  Input types: `new spec | spec slice | change request | new initiative | maintenance request | harness improvement` (see `docs/FEATURE_INTAKE.md`). Note the returned intake id.

### Phase 2: Implementation & Branching

**Branching strategy (PR-based — never push to `main` directly):**

1. **Epic Branch:** `main` → `epic/<name>` (integration point).
2. **Sub-issue Branch:** `epic/<name>` → `feature/<issue-#>-<desc>` (branch from epic, never from `main`).
3. **Standalone Issue:** `main` → `feature/<issue-#>-<desc>`.

For `normal` / `high-risk` lanes, create or update a story keyed to the issue:

```bash
scripts/bin/harness-cli.exe story add --id <issue-#> --title "<title>" --lane <tiny|normal|high-risk>
```

Implement the changes, follow conventions, and fix all build/runtime errors.

### Phase 3: Testing (MANDATORY)

Before completing an issue you MUST test and post a report. Do not complete if tests fail.

- **Backend:** Call API (curl/UI); check status / shape / errors.
- **Frontend:** Interact with UI; check loading / error / success states.
- **Integration:** Run the end-to-end flow.
- **Infra/Config:** Run scripts; verify config application.

Record proof in the harness (keyed to the issue number):

```bash
scripts/bin/harness-cli.exe story update --id <issue-#> --status implemented \
  --unit <0|1> --integration <0|1> --e2e <0|1> --evidence "<command + result>"
```

**Post this Test Report on the issue (`gh issue comment <issue-#> --body "..."`).**
Use the project's real commands — there is no `lint` script:

```md
### Test Report

- **Scope & Cases:** [...]
- **Results:** `npm run build` (✅/❌), `npm test` (✅/❌)
- **Smoke Test:** [ ] App starts (`npm start`), [ ] Core flow works, [ ] No critical errors
```

### Phase 4: Completion & Merging (PR-based)

Before finishing, record a harness trace:

```bash
scripts/bin/harness-cli.exe trace --summary "<what was done>" --story <issue-#> \
  --outcome <completed|blocked|partial|failed> --changed "<files changed>"
```

**A. Epic sub-issues (auto-proceed):** Do NOT ask for confirmation between issues.
Do NOT close the sub-issue — it auto-closes when the epic merges to `main`.

1. Post Implementation Summary (files changed, what/why) + Test Report.
2. Update checklist: `gh issue edit <id> --body "<updated body with [x]>"`.
3. Stage explicitly, commit (`feat(#id): desc`), and push the sub-issue branch.
4. Open and merge a PR into the epic branch:
   ```bash
   gh pr create --base epic/<name> --head feature/<issue-#>-<desc> \
     --title "feat(#<id>): <desc>" --body "Part of epic:<name>"
   gh pr merge --merge --delete-branch
   ```
5. Proceed immediately to the next issue in the epic.

**B. Standalone issues & finalizing epics:** STOP and WAIT for user confirmation.

- **Standalone:** open a PR `feature/...` → `main` with body `Closes #<id>`.
  After approval: `gh pr merge --merge --delete-branch`. Merging to `main`
  auto-closes the issue.
- **Epic finalize:** after approval, open a PR `epic/<name>` → `main` whose body
  lists `Closes #<sub-1>` … `Closes #<epic-#>` (one per line) so every sub-issue
  and the epic issue auto-close on merge:
  ```bash
  gh pr merge --merge
  ```

## 5. GH CLI Command Reference

Use the `gh` CLI exclusively. No web UI or raw API calls.

- `gh issue view <id>` (append `--json body -q '.body'` to read/update checklists)
- `gh issue list --label "..."`
- `gh issue create --title "..." --label "..." --body "..."`
- `gh issue edit <id> --body "..."` (or `--add-label "..."`)
- `gh issue comment <id> --body "..."`
- `gh issue close <id>` (only for issues that do not auto-close via a PR)
- `gh pr create --base <target> --head <branch> --title "..." --body "..."`
- `gh pr merge --merge [--delete-branch]`

**NEVER create an issue on the upstream repo when working on a fork.**

## 6. Multi-Issue & Epic Workflow

**Epic branching strategy (MANDATORY).** Epics use a dedicated integration
branch. **NEVER** merge sub-issues directly to `main`, and never push to `main`.

- **Hierarchy:** `main` → `epic/<name>` → `feature/<issue-#>-<desc>` (or `fix/...`)

**Step-by-Step Execution:**

**1. Setup & Planning**

- List issues: `gh issue list --label "epic:<name>"`
- Work strictly in dependency order. Reference them (`Depends on #XX`).
- Check whether the epic branch exists: `git branch -a | grep "epic/"`

**2. Start Epic (if the branch does not exist)**

```bash
git checkout main && git pull origin main
git checkout -b epic/<name> && git push -u origin epic/<name>
```

**3. Start Sub-Issue (always branch from the epic)**

```bash
git checkout epic/<name> && git pull origin epic/<name>
git checkout -b feature/<issue-#>-<desc>
```

**4. Complete Sub-Issue (auto-proceed)**
_Rule: Do NOT ask for confirmation. Do NOT close the sub-issue._

```bash
# Update the issue
gh issue comment <id> --body "## Implementation Summary ..."
gh issue edit <id> --body "<updated body with [x] checks>"

# Commit & push the sub-issue branch
git add <files>
git commit -m "feat(#<id>): <desc>"
git push -u origin feature/<issue-#>-<desc>

# Open & merge a PR into the epic branch
gh pr create --base epic/<name> --head feature/<issue-#>-<desc> \
  --title "feat(#<id>): <desc>" --body "Part of epic:<name>"
gh pr merge --merge --delete-branch
```

**5. Complete Epic (user approval required)**
_Rule: STOP and WAIT for explicit user approval before merging to `main`._

```bash
git checkout epic/<name> && git pull origin epic/<name>

# PR body lists every issue to auto-close on merge to main
gh pr create --base main --head epic/<name> \
  --title "epic(<name>): <summary>" \
  --body "Closes #<sub-1>
Closes #<sub-2>
Closes #<epic-#>"

# After explicit approval:
gh pr merge --merge   # merging to main auto-closes all referenced issues
```

<!-- HARNESS:BEGIN -->
## Harness

This repo uses Harness. Before work, read:

- `README.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTEXT_RULES.md`
- `scripts/bin/harness-cli query matrix`

Use the Rust Harness CLI at `scripts/bin/harness-cli.exe` (Windows) as the main
operational tool.

**Always run the CLI from the project root.** The CLI resolves `harness.db`
relative to the current directory (`<cwd>/harness.db`); it does not walk up to
the git root. Running from a subdirectory targets a non-existent DB and errors.
Do not set `HARNESS_DB` / `HARNESS_REPO_ROOT` in a shell profile — the framework
has no multi-repo support, so a global override would point every repo at this
project's DB. Use an inline, one-shot override only if ever needed.
<!-- HARNESS:END -->

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **fin-acc** (3683 symbols, 5121 relationships, 86 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/fin-acc/context` | Codebase overview, check index freshness |
| `gitnexus://repo/fin-acc/clusters` | All functional areas |
| `gitnexus://repo/fin-acc/processes` | All execution flows |
| `gitnexus://repo/fin-acc/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
