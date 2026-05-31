# Harness Backlog

Use this file when an agent discovers a missing harness capability but should
not change the operating model immediately.

## Template

```md
## Missing Harness Capability

### Title

Short name.

### Discovered While

Task or story that exposed the gap.

### Current Pain

What was hard, repeated, ambiguous, or unsafe?

### Suggested Improvement

What should be added or changed?

### Risk

Tiny, normal, or high-risk.

### Status

proposed | accepted | implemented | rejected
```

## Items

## Missing ESLint/Prettier

### Title

Add linting configuration

### Discovered While

Initial harness setup

### Current Pain

No code style enforcement. Formatting inconsistencies across files.

### Suggested Improvement

Add `.eslintrc.js` and `.prettierrc` configured for ES Modules + Svelte.

### Risk

tiny

### Status

proposed

---

## Missing CI Workflow

### Title

Add GitHub Actions CI workflow

### Discovered While

Initial harness setup

### Current Pain

No automated testing on PR/push. No build verification.

### Suggested Improvement

Add `.github/workflows/ci.yml` running `npm test` and `npm run build`.

### Risk

tiny

### Status

proposed

---

## Sequelize-auto in Dependencies

### Title

Move sequelize-auto to devDependencies

### Discovered While

Package.json review

### Current Pain

`sequelize-auto` is in `dependencies` but is a dev tool only.

### Suggested Improvement

Move to `devDependencies`.

### Risk

tiny

### Status

proposed

