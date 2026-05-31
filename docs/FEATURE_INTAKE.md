# Feature Intake

Every implementation prompt enters the intake gate before code changes.

## Intake Flow

```
User prompt
    ↓
Classify input type
    ↓
Restate as work item
    ↓
Find affected surface (routes/, models/, libs/, front/)
    ↓
Run risk checklist
    ↓
Choose lane: tiny, normal, or high-risk
```

## Input Types

| Type | Use when | Typical artifact |
|------|----------|------------------|
| New spec | Project spec → product docs | `docs/product/*`, decisions |
| Spec slice | Implementing selected behavior | Story packet |
| Change request | Changing, fixing, refining behavior | Story packet |
| New initiative | Larger product area | Initiative notes + stories |
| Maintenance request | Dependencies, architecture, perf | Story packet or decision |
| Harness improvement | Improving agent collaboration | `docs/HARNESS_BACKLOG.md` |

## Lanes

### Tiny

Use for low-risk: copy, names, config changes, CSS tweaks.

Requirements:
- Patch directly
- Run quick checks (`npm test` or `npm run build`)
- Update affected docs

### Normal

Use for story-sized behavior with bounded blast radius.

Requirements:
- Create or update story packet from `docs/templates/story.md`
- Link relevant product docs
- Implement smallest vertical slice
- Run `npm test` before claiming done

### High-Risk

Use when work affects: **Auth**, **Authorization**, **Data model**, **Audit**, **External systems**.

Requirements:
- Create high-risk story folder from `docs/templates/high-risk-story/`
- Fill in overview, design, execplan, validation
- Ask for human confirmation before implementation
- Record decision if architecture changes

## Risk Checklist

| Risk flag | Applies when work touches |
|-----------|---------------------------|
| Auth | login, logout, sessions, JWT, password (Passport.js) |
| Authorization | tenant scope, roles, permissions |
| Data model | Sequelize models, migrations, schema changes |
| Audit | audit logs, privacy, sensitive data |
| External systems | email, payments, webhooks |
| Public contracts | API shape, response envelope |
| Multi-domain | more than one product area changes |
| Existing behavior | changing implemented behavior |

### Classification

```
0-1 flags  → tiny or normal
2-3 flags  → normal with stronger validation
4+ flags   → high-risk

Hard gates (always high-risk):
- Auth / Authorization
- Data loss or migration
- Audit/security
```

## Project-Specific Triggers

| Trigger | Action |
|---------|--------|
| Changes to `routes/` | Read adjacent API routes for patterns |
| Changes to `models/` | Check `models/index.js` registry |
| Changes to `libs/` | Verify exports used by routes |
| Changes to `front/svelte/` | Check component patterns |
| Tenant isolation changes | Treat as **high-risk** |
| Auth/Passport changes | Treat as **high-risk** |

## Output

```
Lane: normal
Reason: touches API contract and tenant isolation
Files: routes/api_account.js, models/Account.js
Story: docs/stories/US-XXX-*.md
Validation: npm test (✅/❌)
```
