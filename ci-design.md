# CI/CD Design – Rhombus AI

## Overview

This document explains how I would integrate the test suite into CI/CD. The goal is fast feedback on PRs, comprehensive nightly coverage, and high confidence before releases.

From my experience running regression pipelines on GitHub Actions with AWS infrastructure for enterprise clients, I know that the key factors are speed, reliability, and proper gating.

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
test('@critical @api Upload endpoint', ...)

// Data Validation
test('@data Schema validation', ...)
test('@data Row count after transformations', ...)
```

**Tags explained:**

- `@smoke` – Must pass. Blocks PR merge.
- `@critical` – Must pass for release.
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
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci && npx playwright install chromium

      - name: Run API tests
        run: npm run test:api -- --grep @smoke
        env:
          RHOMBUS_EMAIL: ${{ secrets.RHOMBUS_EMAIL }}
          RHOMBUS_PASSWORD: ${{ secrets.RHOMBUS_PASSWORD }}
```

**What blocks merge:**

- Any `@smoke` test failure
- Lint errors

---

### 2. Nightly Pipeline

**When:** 3 AM AEST (17:00 UTC) daily  
**Time:** ~30 minutes  
**Purpose:** Full regression, catch slow-burning bugs

```yaml
# .github/workflows/nightly.yml
name: Nightly Regression

on:
  schedule:
    - cron: "0 17 * * *"
  workflow_dispatch:

jobs:
  full-regression:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci && npx playwright install

      - name: Run full UI tests
        run: npx playwright test --project=${{ matrix.browser }}
        env:
          RHOMBUS_EMAIL: ${{ secrets.RHOMBUS_EMAIL }}
          RHOMBUS_PASSWORD: ${{ secrets.RHOMBUS_PASSWORD }}

      - name: Run all API tests
        run: npm run test:api
        env:
          RHOMBUS_EMAIL: ${{ secrets.RHOMBUS_EMAIL }}
          RHOMBUS_PASSWORD: ${{ secrets.RHOMBUS_PASSWORD }}

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

      - name: Install dependencies
        run: npm ci && npx playwright install

      - name: Run critical tests
        run: npx playwright test --grep "@smoke|@critical"
        env:
          RHOMBUS_EMAIL: ${{ secrets.RHOMBUS_EMAIL }}
          RHOMBUS_PASSWORD: ${{ secrets.RHOMBUS_PASSWORD }}

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

| Pipeline    | Trigger               | Tests                                    | Time    | Blocks                |
| ----------- | --------------------- | ---------------------------------------- | ------- | --------------------- |
| **PR**      | Every PR              | `@smoke` only                            | ~5 min  | Merge                 |
| **Nightly** | 3 AM AEST (17:00 UTC) | All tests                                | ~30 min | Nothing (alerts team) |
| **Release** | Manual                | `@smoke` + `@critical` + data validation | ~10 min | Deploy                |

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

**Security Best Practices:**

- Secrets stored in GitHub Secrets, never in code
- Injected at runtime via `${{ secrets.* }}`
- Never printed to logs (`::add-mask::` for sensitive outputs)
- Separate test accounts from production data
- Rotate credentials periodically

From my experience, preventing secret leakage during workflow runs is critical. I always ensure:

- No `echo` statements print sensitive values
- Artifacts are reviewed before public upload
- Workflow permissions follow least-privilege principle

---

## Future Enhancements

Based on my experience with enterprise CI/CD pipelines, I would add:

### Parallel Test Sharding

- Split UI tests across multiple runners for faster execution
- Use Playwright's built-in sharding: `--shard=1/4`

### Performance Testing Integration

- **Load Testing with k6 or JMeter** - Run on a schedule separate from functional tests
- **API Latency Tracking** - Alert on P95/P99 regressions
- **Stress Testing** - Weekly runs to identify breaking points

### BDD Integration

- Integrate Cucumber.js for Gherkin-style tests
- Generate living documentation from test executions
- Enable non-technical stakeholders to review test scenarios

### Deployment Verification

- Run smoke tests automatically after each deployment
- Blue/green deployment health checks
- Rollback triggers on critical test failures

### Visual Regression

- Percy or Playwright screenshot comparison
- Only on nightly to avoid PR slowdown
- Focused on key UI components, not entire pages
