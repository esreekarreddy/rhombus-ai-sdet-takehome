# Test Strategy – Rhombus AI

## 1. Top Regression Risks

### Risk 1: Data Loss During CSV Upload and Ingestion

**Why High Impact:**  
Loss or corruption of customer data during upload would be catastrophic. Users trust Rhombus AI with potentially sensitive datasets, and any data loss undermines core product value.

**Why Likely to Regress:**  
- File parsing logic handles multiple CSV formats, encodings, and edge cases
- Changes to upload endpoints or file processing pipelines can introduce silent failures
- Large file handling, timeout behavior, and chunked uploads are prone to edge case bugs

**Mitigation Layers:**
- **API tests:** Verify upload endpoints return correct status codes and file IDs
- **Data validation:** Compare row counts and checksums between uploaded and processed files
- **UI tests:** Validate upload success indicators and error messaging

---

### Risk 2: Data Transformation Incorrectness

**Why High Impact:**  
Users rely on transformations to clean, reshape, and prepare data. Incorrect transformations (wrong formulas, dropped columns, type coercion errors) can lead to downstream business decisions based on flawed data.

**Why Likely to Regress:**
- Transformation logic is complex and interdependent
- AI-driven transformations may have non-deterministic outputs that mask bugs
- Manual transformation rules (filtering, deduplication, joins) have many edge cases

**Mitigation Layers:**
- **Data validation:** Automated correctness checks comparing input and output (schema, types, row counts, sample values)
- **API tests:** Verify transformation metadata and status
- **UI tests:** Smoke test that transformations complete end-to-end

---

### Risk 3: AI Pipeline Failures or Timeouts

**Why High Impact:**  
The AI-assisted pipeline is a differentiating feature. If pipelines fail to execute, hang indefinitely, or produce errors, users cannot complete their workflows.

**Why Likely to Regress:**
- AI model changes, API integration updates, or infrastructure scaling issues can cause failures
- Timeout behavior and retry logic are difficult to test exhaustively
- Error recovery paths may not be well-exercised in production

**Mitigation Layers:**
- **API tests:** Poll pipeline status endpoints to detect failures, validate state transitions
- **UI tests:** Verify pipeline creation, execution progress indicators, and completion states
- **Contract tests (future):** Validate AI service API contracts

---

### Risk 4: File Download and Export Corruption

**Why High Impact:**  
After transformation, users download results. Corrupted, incomplete, or incorrectly formatted downloads render the product unusable for that session.

**Why Likely to Regress:**
- Export logic must handle various output formats (CSV, Excel, JSON)
- Streaming large files can introduce truncation or encoding issues
- Changes to backend serialization logic can break downloads

**Mitigation Layers:**
- **Data validation:** Parse and validate downloaded files programmatically
- **API tests:** Verify download endpoints return correct content-type, status codes, and file sizes
- **UI tests:** Trigger download action and verify file presence

---

### Risk 5: Authentication and Session Management

**Why High Impact:**  
Users must remain authenticated to access datasets and pipelines. Session expiration, token invalidation, or logout bugs can cause data loss or workflow interruption.

**Why Likely to Regress:**
- Authentication flows involve multiple services (OAuth, JWT, session cookies)
- Security updates, token refresh logic, and timeout behavior change frequently
- Edge cases like concurrent sessions or expired tokens are easy to break

**Mitigation Layers:**
- **API tests:** Validate login, token refresh, and session invalidation behavior
- **UI tests:** Test login flow, session persistence, and logout
- **Security tests (future):** Token validation, CSRF, and session hijacking

---

## 2. Automation Prioritization

### What to Automate First

**1. Smoke Tests – Critical Path (UI + API)**  
**Why:**  
- Provides fast feedback on whether core workflows function
- Blocks broken builds from reaching QA or production
- Covers login, upload, transformation, and download – the essential user journey

**2. Data Correctness Validation**  
**Why:**  
- Data integrity is the product's core value proposition
- Catches subtle bugs that UI tests miss (wrong calculations, dropped rows, type errors)
- High ROI: prevents silent failures that damage user trust

**3. API Contract Tests (Authentication, Upload, Pipeline Status)**  
**Why:**  
- Faster than UI tests, providing quick regression coverage
- Validates backend logic independently of UI changes
- Detects breaking API changes early

### What NOT to Automate Yet

**1. AI-Generated Content Validation**  
**Why:**  
- AI outputs are probabilistic and non-deterministic
- Exact output matching is impossible; structural validation is sufficient for now
- Manual review and user feedback are better suited for AI quality assessment

**2. Comprehensive UI Visual Regression**  
**Why:**  
- High maintenance cost with pixel-level comparisons
- Low ROI for a data-heavy application where functionality > appearance
- Better suited for marketing pages, not workflow tools

**3. Performance and Load Testing**  
**Why:**  
- Requires production-like infrastructure and scale
- Better handled in dedicated performance testing phases
- Functional correctness is higher priority initially

---

## 3. Test Layering Strategy

### UI End-to-End Tests (Playwright)

**Purpose:**  
Validate critical user journeys from the user's perspective, ensuring workflows complete successfully.

**Failure Types Detected:**
- Navigation and routing issues
- UI state management bugs
- Integration failures between frontend and backend
- User-facing error messages

**Coverage:**
- Login flow
- File upload and preview
- Transformation application (manual or AI-assisted)
- Pipeline execution progress
- File download

**Maintenance Strategy:**
- Use Page Object Model for maintainability
- Keep test count low (5-10 critical flows)
- Run on every PR and release

---

### API / Network-Level Tests

**Purpose:**  
Test backend services independently of the UI, providing fast and reliable regression coverage.

**Failure Types Detected:**
- API contract violations (breaking changes)
- Status code errors
- Response payload schema issues
- Authentication and authorization failures

**Coverage:**
- Authentication endpoints (login, logout, token refresh)
- Dataset upload and validation
- Pipeline creation and status polling
- Download endpoints
- Error handling (400, 401, 403, 500 responses)

**Maintenance Strategy:**
- Run on every commit
- Use JSON schema validation for response payloads
- Include negative test cases

---

### Data Validation Tests

**Purpose:**  
Validate that transformations are mathematically and logically correct, not just that workflows complete.

**Failure Types Detected:**
- Incorrect calculations
- Data loss (dropped rows or columns)
- Type coercion errors
- Schema mismatches

**Coverage:**
- Input vs. output row count validation
- Column schema validation (names, types)
- Sample value correctness (for deterministic transformations)
- Edge case handling (nulls, empty strings, special characters)

**Maintenance Strategy:**
- Run nightly with known test datasets
- Use golden files or reference outputs for comparison
- Separate deterministic validation from probabilistic AI outputs

---

## 4. Regression Strategy

### What Runs on Every Pull Request

**Smoke Tests (UI + API) – ~5 minutes**
- Login flow
- Upload small CSV
- One transformation
- Download result
- Authentication API tests
- Upload API validation

**Why:**  
Provides fast feedback to developers. If these fail, the PR is not mergeable.

---

### What Runs Nightly

**Full Regression Suite – ~30-45 minutes**
- All UI tests (including edge cases and error paths)
- All API tests (positive and negative)
- Data validation tests with larger datasets
- Cross-browser tests (Chromium, Firefox, Safari)

**Why:**  
Catches issues that are not in the critical path but would block releases. Provides deeper coverage without slowing PR velocity.

---

### What Blocks a Release

**Release Smoke + Data Integrity – ~10 minutes**
- Full smoke test suite (UI + API)
- Data validation on production-like datasets
- Security checks (authentication, authorization)

**Why:**  
Final gate before production deployment. Must pass to deploy.

---

### Execution Strategy

| Test Type         | PR | Nightly | Release |
|-------------------|----|---------|---------|
| Smoke (UI + API)  | ✅ | ✅      | ✅      |
| Full UI Regression| ❌ | ✅      | ✅      |
| Full API Tests    | ✅ | ✅      | ✅      |
| Data Validation   | ❌ | ✅      | ✅      |
| Cross-Browser     | ❌ | ✅      | ❌      |

---

## 5. Testing AI-Driven Behavior

### What to Assert

**1. Pipeline Completion**  
Verify that AI-assisted pipelines execute to completion without errors, regardless of the specific transformation logic.

**2. Structural Correctness**  
Assert that outputs have valid schemas (correct column names, types, row counts within expected bounds).

**3. State Transitions**  
Validate that pipeline states progress correctly: `created` → `running` → `completed` (or `failed`).

**4. User-Facing Feedback**  
Check that progress indicators, completion messages, and error states are displayed correctly.

---

### What NOT to Assert

**1. Exact AI-Generated Content**  
Do not assert specific transformation logic or exact output values for AI-driven features. AI models are probabilistic and outputs may vary.

**2. Performance Metrics**  
AI processing times are variable. Avoid hard-coded timeout values; use polling with reasonable upper bounds instead.

**3. AI Suggestions**  
Do not validate the quality or relevance of AI recommendations. These are subjective and change with model updates.

---

### Keeping Tests Deterministic

**1. Use Known Input Datasets**  
Test with fixed CSV files that produce predictable results (or predictable result patterns).

**2. Test AI Invocation, Not AI Output**  
Assert that "AI was called" and "a result was returned," not that the result is exactly X.

**3. Tolerance Ranges**  
For numerical transformations, validate results within acceptable ranges (e.g., ±1% for rounding).

**4. Fallback Paths**  
Test that manual transformations work when AI is unavailable or fails.

---

## 6. Flaky Test Analysis

### Common Causes of Flakiness in Rhombus AI

**1. Asynchronous UI Updates**  
The application updates dynamically based on backend responses. Tests fail intermittently if they check UI state before updates complete.

**Mitigation:**
- Use Playwright's built-in waits (`waitForSelector`, `waitForLoadState`)
- Avoid `setTimeout` or fixed delays
- Wait for specific conditions (e.g., spinner disappears, button enabled)

---

**2. Network Variability**  
File uploads, pipeline execution, and downloads depend on network speed and backend processing time.

**Mitigation:**
- Use polling with exponential backoff for status checks
- Set reasonable timeout values (e.g., 60s for uploads, 5min for pipeline execution)
- Retry transient network failures (429, 503 errors)

---

**3. Test Data Collisions**  
Multiple test runs using the same account can create overlapping datasets or pipelines, causing state conflicts.

**Mitigation:**
- Use unique identifiers (timestamps, UUIDs) for test datasets
- Clean up test data after execution (delete pipelines, datasets)
- Isolate tests with separate test accounts if possible

---

**4. Race Conditions in State Management**  
UI components may render before data is fully loaded, causing assertions to fail sporadically.

**Mitigation:**
- Assert on stable elements (e.g., "success" text, download button enabled)
- Use `waitForResponse` to ensure API calls complete before proceeding

---

### Detecting Flakiness Over Time

**1. Test Execution Tracking**  
Run tests multiple times (10x, 100x) to detect intermittent failures.

**2. CI Metrics**  
Track pass/fail rates over time. Flag tests with <95% pass rate as flaky.

**3. Failure Analysis**  
Log detailed failure information (screenshots, network logs, timings) to identify patterns.

**4. Automated Retries**  
Allow tests to retry once on failure. If pass on retry, flag as potentially flaky.

---

### Reducing, Quarantining, or Eliminating Flaky Tests

**1. Fix Root Cause**  
Investigate and fix timing issues, race conditions, or environment dependencies.

**2. Quarantine**  
Move flaky tests to a separate suite that runs nightly but does not block PRs.

**3. Rewrite**  
If a test remains flaky after fixes, consider rewriting it at a different layer (e.g., API instead of UI).

**4. Remove**  
If a test provides low value or cannot be stabilized, delete it. A flaky test is worse than no test.

---

## Summary

This strategy prioritizes **data integrity**, **critical user workflows**, and **test reliability**. By layering tests appropriately, automating high-value scenarios first, and addressing flakiness proactively, we ensure Rhombus AI delivers a trustworthy product with fast, confident release cycles.
