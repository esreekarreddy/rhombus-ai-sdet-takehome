# CI / Regression Design – Rhombus AI

## Overview

This document defines how automated tests integrate into the CI/CD pipeline for Rhombus AI, including test categorization, execution triggers, and failure handling strategies.

## Test Categorization Strategy

Tests are tagged with multiple dimensions to enable flexible execution:

### Tag Dimensions

#### 1. Priority
- `@smoke` – Critical path tests that must pass for basic functionality
- `@regression` – Full coverage tests for release confidence
- `@extended` – Comprehensive edge case and cross-browser tests

#### 2. Layer
- `@ui` – Playwright end-to-end tests
- `@api` – Network/service-level tests
- `@data` – Data validation tests

#### 3. Feature Area
- `@auth` – Authentication and session management
- `@upload` – File upload and ingestion
- `@transformation` – Data transformation workflows
- `@pipeline` – AI pipeline execution
- `@download` – File export and download

#### 4. Risk Level
- `@critical` – Directly impacts user data or core workflows
- `@high` – Impacts major features
- `@medium` – Impacts secondary features
- `@low` – Edge cases or rare scenarios

### Example Test Tags

```javascript
// Playwright test
test('@smoke @ui @auth @critical - User login flow', async ({ page }) => {
  // ...
});

// API test
test('@smoke @api @upload @critical - Upload CSV file', async () => {
  // ...
});

// Data validation
test('@regression @data @transformation @critical - Validate row count', async () => {
  // ...
});
```

---

## Pipeline Execution Strategy

### 1. Pull Request Pipeline

**Trigger:** On every pull request to `main` or `develop`

**Execution Time Target:** < 10 minutes

**Tests Executed:**
- `@smoke` tests (UI + API)
- `@critical` data validation (small datasets)
- Linting and code quality checks

**Parallelization:**
- Run UI, API, and data validation suites concurrently
- Split UI tests across 2-3 workers

**Failure Behavior:**
- **Block merge** if any test fails
- Auto-retry once on failure (to handle transient issues)
- Post results as PR comment with links to detailed reports

**Artifacts:**
- Test results (JUnit XML)
- Screenshots on failure
- Playwright trace files
- API request/response logs

**Pseudo-YAML:**
```yaml
name: PR Tests

on:
  pull_request:
    branches: [main, develop]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1/3, 2/3, 3/3]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: |
          cd ui-tests && npm ci
          cd ../api-tests && npm ci
      - name: Run smoke tests
        run: |
          cd ui-tests
          npx playwright test --grep @smoke --shard ${{ matrix.shard }}
      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.shard }}
          path: |
            ui-tests/playwright-report/
            ui-tests/test-results/
  
  api-smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run API smoke tests
        run: |
          cd api-tests
          npm ci
          npm test -- --grep @smoke
  
  require-passing:
    needs: [smoke-tests, api-smoke]
    runs-on: ubuntu-latest
    steps:
      - run: echo "All smoke tests passed"
```

---

### 2. Nightly Regression Pipeline

**Trigger:** Daily at 2:00 AM UTC

**Execution Time Target:** < 45 minutes

**Tests Executed:**
- All `@regression` tests (UI + API + data validation)
- Cross-browser tests (Chromium, Firefox, Safari)
- Extended data validation with larger datasets
- Performance smoke tests (load time, API latency)

**Parallelization:**
- Run 5-10 parallel workers for UI tests
- Separate jobs for each browser
- Concurrent API and data validation suites

**Failure Behavior:**
- **Do not block development** (non-blocking)
- Send Slack notification on failure
- Create GitHub issue for failing tests (auto-tagged)
- Generate trend report comparing to previous runs

**Artifacts:**
- Full Playwright HTML report
- Video recordings of failures
- Network HAR files
- Data validation reports (CSV diffs)
- Performance metrics

**Pseudo-YAML:**
```yaml
name: Nightly Regression

on:
  schedule:
    - cron: '0 2 * * *'  # 2:00 AM UTC daily
  workflow_dispatch:  # Manual trigger

jobs:
  ui-regression:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
        shard: [1/5, 2/5, 3/5, 4/5, 5/5]
    steps:
      - uses: actions/checkout@v3
      - name: Run UI regression
        run: |
          cd ui-tests
          npm ci
          npx playwright test --grep @regression --project ${{ matrix.browser }} --shard ${{ matrix.shard }}
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: ui-results-${{ matrix.browser }}-${{ matrix.shard }}
          path: ui-tests/playwright-report/

  api-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run all API tests
        run: |
          cd api-tests
          npm ci
          npm test
  
  data-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Run data validation
        run: |
          cd data-validation
          pip install -r requirements.txt
          python validate_output.py --mode full
  
  notify:
    needs: [ui-regression, api-regression, data-validation]
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Notify on Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Nightly regression failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Nightly regression tests failed. <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Results>"
                  }
                }
              ]
            }
```

---

### 3. Pre-Release Pipeline

**Trigger:** Manually before production deployment

**Execution Time Target:** < 15 minutes

**Tests Executed:**
- All `@smoke` tests
- All `@critical` tests
- Security smoke tests (auth, CSRF, XSS basics)
- Data integrity validation with production-like datasets

**Parallelization:**
- Maximum parallelization for speed
- Run against staging environment (production mirror)

**Failure Behavior:**
- **Block release deployment**
- Require manual override (with approval from QA lead)
- Send alert to release manager

**Artifacts:**
- Detailed test execution report
- Security scan results
- Data validation report
- Environment health check logs

**Pseudo-YAML:**
```yaml
name: Pre-Release Gate

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to test'
        required: true
        default: 'staging'

jobs:
  release-gate:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v3
      - name: Run smoke tests
        run: |
          cd ui-tests
          npm ci
          npx playwright test --grep "@smoke|@critical"
      - name: Run API critical tests
        run: |
          cd api-tests
          npm ci
          npm test -- --grep "@smoke|@critical"
      - name: Data integrity check
        run: |
          cd data-validation
          pip install -r requirements.txt
          python validate_output.py --mode critical
      - name: Generate release report
        if: always()
        run: |
          echo "Release readiness report" > release-report.md
          echo "All critical tests passed" >> release-report.md
      - name: Block on failure
        if: failure()
        run: exit 1
```

---

## What Blocks What

### Pull Request Merge
**Blocked by:**
- Any `@smoke` test failure
- Linting or code quality failures
- Merge conflict

**Not blocked by:**
- Nightly regression failures
- Performance degradation (warning only)

---

### Production Release
**Blocked by:**
- Any `@critical` test failure
- Any `@smoke` test failure
- Security scan failures
- Data validation failures

**Not blocked by:**
- `@medium` or `@low` test failures (with approval)
- Known flaky tests (if documented)

---

### Deployment to Staging
**Blocked by:**
- Integration test failures
- Build failures

**Not blocked by:**
- UI test failures (can deploy for exploratory testing)

---

## Artifact Collection

### Always Collected
- Test execution logs (stdout/stderr)
- JUnit XML reports (for CI dashboards)
- Failure screenshots (on UI test failures)

### On Failure
- Full Playwright trace files (for debugging)
- Video recordings of failed tests
- Network HAR files (API calls)
- Browser console logs
- DOM snapshots at failure point

### On Nightly Runs
- HTML test reports (published to GitHub Pages)
- Test execution trends (pass/fail rate over time)
- Performance metrics (load times, API latencies)
- Coverage reports (if applicable)

### Storage Strategy
- **Short-term (7 days):** All artifacts in CI system
- **Long-term (90 days):** Failure artifacts and nightly reports in S3
- **Permanent:** Release gate reports

---

## Test Quarantine Strategy

### When to Quarantine
A test is quarantined if:
- Pass rate < 90% over 10 runs
- Fails intermittently without code changes
- Requires manual intervention to pass

### Quarantine Process
1. Tag test with `@quarantine`
2. Move to separate test suite
3. Run in nightly pipeline only (non-blocking)
4. Create GitHub issue to track fix
5. Remove from PR and release gates

### Quarantine Review
- Weekly review of quarantined tests
- Fix or delete within 2 weeks
- If unfixable, consider rewriting at different layer

---

## Rollback Strategy

### Automatic Rollback Triggers
- Critical test failures in production smoke tests post-deployment
- Error rate spike > 5% in production monitoring
- Data validation failures in production

### Manual Rollback
- QA lead or release manager can trigger
- Requires justification and incident report

---

## Notifications

### Slack Channels
- `#ci-alerts` – All test failures
- `#releases` – Release gate results
- `#qa-team` – Nightly regression summary

### Notification Rules
- **PR tests:** Comment on PR with results
- **Nightly:** Slack notification only on failure
- **Release gate:** Slack + email to release manager

---

## Metrics and Dashboards

### Key Metrics Tracked
- Test execution time (per suite)
- Pass/fail rates (per tag, per suite)
- Flaky test count
- Time to detect failures (feedback loop time)
- Test coverage (% of features with automated tests)

### Dashboard Views
1. **CI Health Dashboard**
   - Current pipeline status
   - Recent failure trends
   - Flaky test list

2. **Release Readiness Dashboard**
   - Pre-release test results
   - Outstanding critical issues
   - Deployment approval status

3. **Test Execution Trends**
   - Historical pass/fail rates
   - Average execution times
   - Test count growth

---

## Future Enhancements

### Short-term (Next Quarter)
- Add contract testing for AI service APIs
- Implement visual regression testing for key UI components
- Add performance benchmarking to nightly runs

### Long-term (Next Year)
- Chaos engineering tests (simulate failures)
- A/B testing validation
- Accessibility (a11y) automated checks
- Mobile responsive testing

---

## Summary

This CI design ensures:
- **Fast feedback** on PRs (< 10 min)
- **Comprehensive coverage** in nightly runs
- **High confidence** before releases
- **Minimal false positives** through quarantine strategy
- **Clear accountability** with blocking rules

By categorizing tests and executing them strategically, we balance speed, coverage, and reliability throughout the development lifecycle.
