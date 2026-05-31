# Context Engineering Rules

Context rules help agents decide what to read, when to read it, and when to stop.
They are additive to the stable `AGENTS.md` reading list.

---

## Project Context

> **Stack:** Express.js · Svelte 4.x + Routify 2.x · PostgreSQL + Sequelize 6.x · Passport.js
> **Build:** Vite SPA (`dist/`) + SSR (`dist-ssr/`)
> **Test:** Mocha + Supertest + Playwright

---

## Context Phases

### Intake Phase

| Document | Tiny | Normal | High-Risk |
|----------|------|--------|-----------|
| `AGENTS.md` | Must | Must | Must |
| `docs/FEATURE_INTAKE.md` | Must | Must | Must |
| `docs/HARNESS.md` | Should | Must | Must |
| `docs/TEST_MATRIX.md` | Should | Must | Must |
| `docs/ARCHITECTURE.md` | Skip | Should | Must |
| `README.md` | Should | Must | Must |

### Planning Phase

| Document | Tiny | Normal | High-Risk |
|----------|------|--------|-----------|
| Current files to edit | Must | Must | Must |
| `docs/templates/story.md` | Skip | Must | Should |
| `docs/ARCHITECTURE.md` | Skip | Should | Must |
| `docs/TEST_MATRIX.md` | Should | Must | Must |

### Implementation Phase

| Document | Tiny | Normal | High-Risk |
|----------|------|--------|-----------|
| Files being changed | Must | Must | Must |
| Adjacent files with same pattern | Should | Must | Must |
| `libs/*.js` (shared utilities) | Skip | Should | Must |
| `models/*.js` (Sequelize models) | Skip | Should | Must |

### Validation Phase

| Document | Tiny | Normal | High-Risk |
|----------|------|--------|-----------|
| Story acceptance criteria | Should | Must | Must |
| `docs/TEST_MATRIX.md` | Should | Must | Must |
| `npm test` output | Should | Must | Must |
| `npm run build` output | Should | Must | Must |

### Trace Phase

| Document | Tiny | Normal | High-Risk |
|----------|------|--------|-----------|
| `docs/TRACE_SPEC.md` | Should | Must | Must |
| `git status --short` | Must | Must | Must |
| Validation command output | Should | Must | Must |

---

## Retrieval Triggers

| Trigger | Action |
|---------|--------|
| Task touches database schema, models, or migrations | Read `models/`, `migrations/`, check `.sequelizerc` |
| Task touches auth, tenant, or permissions | Treat as **high-risk**, read `libs/user.js`, `libs/tenant.js` |
| Task changes API routes | Read `routes/api*.js` for existing patterns |
| Task touches Svelte components | Read `front/svelte/` for component patterns |
| Task discovers repeated confusion | Record in `docs/HARNESS_BACKLOG.md` |

---

## Token Budget Guidance

| Lane | Target | What to Read |
|------|--------|--------------|
| Tiny | ~2K tokens | `AGENTS.md`, `docs/FEATURE_INTAKE.md`, changed file |
| Normal | ~5K tokens | Above + `docs/ARCHITECTURE.md`, `docs/TEST_MATRIX.md`, related files |
| High-risk | ~10K tokens | Full context + decisions, product docs, templates |

---

## Before Implementation Checklist

- [ ] Lane chosen from `docs/FEATURE_INTAKE.md`
- [ ] Relevant product docs or story packets identified
- [ ] High-risk trigger handled (auth/tenant = high-risk)

## Before Final Response Checklist

- [ ] Validation evidence read (`npm test`, `npm run build`)
- [ ] `docs/TRACE_SPEC.md` read for normal/high-risk
- [ ] Final trace includes files read, files changed, outcome
