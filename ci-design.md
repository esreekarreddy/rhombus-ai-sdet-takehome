# CI/CD Design – Rhombus AI

## Overview

This document explains how I'd integrate the test suite into CI/CD. The goal is fast feedback on PRs, comprehensive nightly coverage, and high confidence before releases.

---

## Test Tags

I use simple tags to organize tests:

```typescript
// UI Tests
test('@smoke @ui Login and dashboard', ...)
test('@regression @ui All transformers', ...)

// API Tests
test('@smoke @api Auth endpoints', ...)
test('@api @negative Invalid upload', ...)

// Data Validation
test('@data Schema validation', ...)
test('@data Row count after transformations', ...)
```

**Tags explained:**

- `@smoke` – Must pass. Blocks PR merge.
- `@regression` – Full coverage. Nightly.
- `@negative` – Error handling tests.
- `@ui`, `@api`, `@data` – Test layer.

---

## Pipeline Configuration

### 1. Pull Request Pipeline

**When:** Every PR to `main`  
**Time:** < 5 minutes  
**Purpose:** Fast feedback, block broken merges

```yaml
# .github/workflows/pr-tests.yml
name: PR Tests

on:
  pull_request:
    branches: [main]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci && npx playwright install chromium

      - name: Run smoke tests
        run: npx playwright test --grep @smoke
        env:
          RHOMBUS_EMAIL: ${{ secrets.RHOMBUS_EMAIL }}
          RHOMBUS_PASSWORD: ${{ secrets.RHOMBUS_PASSWORD }}

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4

      - name: Run API tests
        run: |
          cd api-tests
          npm ci
          npm test -- --grep @smoke
```

**What blocks merge:**

- Any `@smoke` test failure
- Lint errors

---

### 2. Nightly Pipeline

**When:** 2 AM UTC daily  
**Time:** ~30 minutes  
**Purpose:** Full regression, catch slow-burning bugs

```yaml
# .github/workflows/nightly.yml
name: Nightly Regression

on:
  schedule:
    - cron: "0 2 * * *"
  workflow_dispatch:

jobs:
  full-regression:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4

      - name: Run full UI tests
        run: npx playwright test --project=${{ matrix.browser }}

      - name: Run all API tests
        run: cd api-tests && npm test

      - name: Run data validation
        run: |
          cd data-validation
          pip install -r requirements.txt
          pytest test_validation.py -v

  notify-on-failure:
    needs: full-regression
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {"text": "Nightly regression failed - check results"}
```

**What gets reported:**

- Pass/fail summary in Slack
- Full HTML report as artifact
- Screenshots and videos on failure

---

### 3. Release Pipeline

**When:** Manual trigger before deploy  
**Time:** ~10 minutes  
**Purpose:** Final gate, high confidence release

```yaml
# .github/workflows/release.yml
name: Release Gate

on:
  workflow_dispatch:
    inputs:
      version:
        description: "Release version"
        required: true

jobs:
  release-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run critical tests
        run: npx playwright test --grep "@smoke|@critical"

      - name: Data integrity check
        run: |
          cd data-validation
          pip install -r requirements.txt
          python validator.py ../test-results/downloads/cleaned_data.csv

      - name: Generate release report
        run: echo "Release ${{ inputs.version }} ready"
```

**What blocks release:**

- Any critical test failure
- Data validation failure

---

## Summary Table

| Pipeline    | Trigger  | Tests                                    | Time    | Blocks                |
| ----------- | -------- | ---------------------------------------- | ------- | --------------------- |
| **PR**      | Every PR | `@smoke` only                            | ~5 min  | Merge                 |
| **Nightly** | 2 AM UTC | All tests                                | ~30 min | Nothing (alerts team) |
| **Release** | Manual   | `@smoke` + `@critical` + data validation | ~10 min | Deploy                |

---

## Artifacts Collected

**Always:**

- JUnit XML (for CI dashboards)
- Console logs

**On failure:**

- Screenshots
- Video recordings
- Playwright traces
- Network HAR files

**On nightly:**

- Full HTML report
- Test execution trends
- Data validation report

---

## Flaky Test Handling

In CI, I handle flaky tests with:

1. **Auto-retry** – Tests retry once on failure
2. **Quarantine tag** – `@quarantine` tests run nightly only
3. **Pass rate tracking** – Flag tests below 95%

```yaml
# playwright.config.ts
retries: process.env.CI ? 1 : 0,
```

---

## Secrets Management

Required environment variables:

| Secret             | Purpose               |
| ------------------ | --------------------- |
| `RHOMBUS_EMAIL`    | Test account email    |
| `RHOMBUS_PASSWORD` | Test account password |

Stored in GitHub Secrets, injected at runtime.

---

## What I'd Add Later

If I had more time:

- **Parallel sharding** – Split UI tests across runners
- **Visual regression** – Percy or Playwright screenshot comparison
- **Performance baseline** – Track API latencies
- **Deployment verification** – Run smoke after deploy
