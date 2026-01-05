# Test Strategy – Rhombus AI

## Executive Summary

This document outlines how I'd approach quality engineering for Rhombus AI as a Senior SDET. Having explored the live application, I've identified that Rhombus is a **data transformation platform** with two modes:

1. **AI-Assisted Mode** – Chat-based pipeline creation via natural language
2. **Manual Mode** – Node-by-node pipeline building on a visual canvas

The platform supports **19 transformers** across 5 categories, handles CSV/Excel uploads, and outputs cleaned data. My testing strategy focuses on protecting data integrity, ensuring reliable pipeline execution, and maintaining fast feedback loops.

---

## 1. Top Regression Risks

### Risk 1: Data Corruption During Upload/Transformation

**What happens:** User uploads a CSV, applies transformers, downloads result – but the output has wrong values, missing rows, or schema changes they didn't expect.

**Why it's high impact:**

- Users trust Rhombus with their data. Silent corruption = lost trust = churn.
- A single bug in the Impute transformer could affect every customer using it.

**Why it's likely to regress:**

- 19 transformers, each with complex logic (e.g., Impute calculates mean/median)
- Transformers interact – Text Case + Sort + Remove Duplicates in sequence
- Edge cases: NULL handling, empty strings, unicode, mixed types

**How I'd test it:**

- Data validation scripts comparing input → output (schema, row counts, sample values)
- Targeted transformer tests with known messy data
- API tests to verify transformation endpoints return correct data

---

### Risk 2: Pipeline Execution Failures

**What happens:** User builds a pipeline (manually or via AI), clicks "Apply", and it hangs, errors, or produces no output.

**Why it's high impact:**

- Dead pipelines = stuck users = support tickets
- The "Apply" button is the core call-to-action

**Why it's likely to regress:**

- Backend orchestration across multiple transformers
- Timeout handling when datasets are large
- AI-generated pipelines may create invalid transformer configurations

**How I'd test it:**

- E2E tests that complete the full flow: Upload → Transform → Download
- API tests for pipeline status endpoints (pending → running → completed/failed)
- Negative tests: What happens when a transformer fails mid-pipeline?

---

### Risk 3: AI Agent Misbehavior

**What happens:** User asks the AI to "remove duplicates and sort by date" but it creates wrong transformers, applies them to wrong columns, or fails silently.

**Why it's high impact:**

- AI-Assisted Mode is the recommended flow – it's the first thing new users try
- Bad AI = magic that doesn't work = user gives up

**Why it's likely to regress:**

- LLM outputs change with model updates
- Prompt → transformer mapping is probabilistic
- Context length, dataset schema interpretation

**How I'd test it:**

- Structural validation: AI created pipeline with expected transformer types
- State transitions: Pipeline goes through correct status flow
- **NOT** exact output matching (too brittle for AI)

---

### Risk 4: Download/Export Failures

**What happens:** User completes their pipeline, clicks Download, and gets a corrupted file, empty file, or wrong format.

**Why it's high impact:**

- Download is the final step – it's the whole point of using Rhombus
- Corrupted exports mean the user's work is lost

**Why it's likely to regress:**

- CSV serialization edge cases (commas in values, unicode, large files)
- XLSX export involves different libraries
- Streaming/chunking for large datasets

**How I'd test it:**

- UI test: Click Download → verify file exists and has content
- Data validation: Parse downloaded file and validate structure
- API test: Download endpoint returns correct Content-Type and file size

---

### Risk 5: Authentication/Session Issues

**What happens:** User is logged in, working on a pipeline, session expires, and they lose work or can't save.

**Why it's high impact:**

- Data loss during active work = terrible UX
- Auth bugs block access to the entire product

**Why it's likely to regress:**

- Auth0 integration with token refresh logic
- Session storage for pipeline state
- Multi-tab/multi-device scenarios

**How I'd test it:**

- API tests for login/logout/token refresh
- UI test for login flow
- (Future) Session timeout scenarios

---

## 2. Automation Prioritization

### What I'd Automate First

| Priority | What                               | Why                                              |
| -------- | ---------------------------------- | ------------------------------------------------ |
| 1        | **Manual Transformation E2E Flow** | Core user journey. Deterministic. High signal.   |
| 2        | **Data Validation Scripts**        | Catches silent bugs UI tests miss. Cheap to run. |
| 3        | **Auth API Tests**                 | Fast, reliable, blocks broken builds.            |
| 4        | **Upload/Download API Tests**      | Critical path without UI overhead.               |

### What I'd NOT Automate Yet

| What                     | Why Not                                                         |
| ------------------------ | --------------------------------------------------------------- |
| **AI Output Validation** | Non-deterministic. Test structure, not exact output.            |
| **All 19 Transformers**  | Diminishing returns. Cover high-risk transformers first.        |
| **Visual Regression**    | Low ROI for a data app. Functionality matters more than pixels. |
| **Performance/Load**     | Needs dedicated infrastructure. Not a bug-finding priority.     |

---

## 3. Test Layering Strategy

### Layer 1: UI E2E Tests (Playwright)

**Purpose:** Prove the critical user journey works end-to-end.

**What they catch:**

- Broken navigation, selectors, button states
- Frontend-backend integration failures
- User-facing error messages not appearing

**Coverage:**

- Login → Dashboard → Create Project → Upload → Transform → Download

**Trade-off:** Slow but high confidence. Run on PR + nightly.

---

### Layer 2: API Tests

**Purpose:** Fast feedback on backend functionality without UI overhead.

**What they catch:**

- Endpoint contract violations
- Status code errors (400, 401, 500)
- Response payload schema issues

**Coverage:**

- Auth endpoints (login, logout, refresh)
- Upload endpoint (valid file, invalid file, large file)
- Pipeline execution status
- Download endpoint

**Trade-off:** Fast and reliable. Run on every commit.

---

### Layer 3: Data Validation

**Purpose:** Verify transformations are mathematically correct.

**What they catch:**

- Wrong calculations (mean vs median)
- Dropped rows or columns
- Type coercion bugs
- NULL handling errors

**Coverage:**

- Input messy.csv vs output cleaned_data.csv
- Schema validation (column names, types)
- Row count validation (25 input → 24 output after deduplication)
- Sample value checks (status is lowercase, age/salary are imputed)

**Trade-off:** Runs after E2E test produces output. Highly deterministic.

---

## 4. Regression Strategy

### What Runs When

| Trigger         | Tests                   | Time    | Purpose             |
| --------------- | ----------------------- | ------- | ------------------- |
| **PR**          | Smoke (UI + API)        | ~5 min  | Block broken merges |
| **Nightly**     | Full regression         | ~30 min | Deeper coverage     |
| **Pre-release** | Smoke + Data Validation | ~10 min | Release gate        |

### What Blocks What

| Gate         | Blocked By                                          |
| ------------ | --------------------------------------------------- |
| **PR Merge** | Any smoke test failure                              |
| **Release**  | Any critical test failure + data validation failure |

---

## 5. Testing AI-Driven Behavior

### The Problem with AI Testing

The AI Agent is probabilistic. Given the same prompt twice, it might produce slightly different pipelines. Testing exact outputs is a recipe for flaky tests.

### What I Assert

| Assertion                             | Why It's Stable                |
| ------------------------------------- | ------------------------------ |
| "A pipeline was created"              | Structural check, not content  |
| "Pipeline status reached 'completed'" | State transition, not output   |
| "Output has expected columns"         | Schema check, not exact values |
| "Row count is in expected range"      | Bounds check, not exact count  |

### What I Don't Assert

- Exact transformer types (AI might use different approach)
- Exact output values (tolerance is fine)
- AI-generated suggestions or chat responses

### Making AI Tests Deterministic

1. **Use fixed prompts** – Same input every run
2. **Validate structure** – Pipeline exists, has nodes, completed
3. **Tolerance ranges** – Row count within ±10%
4. **Fallback testing** – If AI fails, manual mode still works

---

## 6. Flaky Test Analysis

### Where Flakiness Comes From (in Rhombus)

| Cause                    | Example                                 | Fix                                     |
| ------------------------ | --------------------------------------- | --------------------------------------- |
| **Async UI updates**     | Checking text before pipeline completes | Use `waitForSelector('text=completed')` |
| **Network variability**  | Upload timeout on large file            | Increase timeout, use retry             |
| **Test data collisions** | Two test runs create same project name  | Use unique `Test_${Date.now()}` names   |
| **AI non-determinism**   | AI creates different pipeline           | Assert structure, not exact content     |

### How I Detect Flakiness

1. **Run tests 10x locally** – If fails 1/10, it's flaky
2. **Track CI pass rate** – Flag tests below 95% pass rate
3. **Retry analysis** – If passes on retry, investigate root cause

### How I Handle Flaky Tests

| Strategy                       | When to Use                            |
| ------------------------------ | -------------------------------------- |
| **Fix root cause**             | First priority – find the timing issue |
| **Quarantine**                 | Move to nightly, remove from PR gate   |
| **Rewrite at different layer** | If UI test is flaky, try API test      |
| **Delete**                     | If test provides no value, remove it   |

---

## Summary

My approach prioritizes:

1. **Data integrity** – Silent corruption is the worst bug
2. **Critical path coverage** – Upload → Transform → Download must work
3. **Fast feedback** – PRs blocked in <5 minutes
4. **Deterministic tests** – No flaky AI assertions

The goal is release confidence without slowing down the team.
