# Rhombus AI – SDET Take-Home Exercise

Automated test suite for [Rhombus AI](https://rhombusai.com) using Playwright with TypeScript.

## 📋 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install browsers (Chromium, Firefox, WebKit)
npx playwright install

# 3. Configure credentials
cp .env.example .env
# Edit .env with your Rhombus AI credentials

# 4. Run all tests
npm test
```

> **Note:** Tests require valid Rhombus AI credentials. Sign up free at https://rhombusai.com

---

## 🧪 Running Tests

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `npm test`            | Run all tests (all browsers) |
| `npm run test:ui`     | UI end-to-end tests only     |
| `npm run test:api`    | API/network tests only       |
| `npm run test:smoke`  | Smoke tests only (fast)      |
| `npm run test:headed` | Run with visible browser     |
| `npm run test:debug`  | Debug mode (step through)    |
| `npm run report`      | Open HTML test report        |

### Run Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

---

## 🔬 Data Validation

```bash
cd data-validation
pip install -r requirements.txt
python validate_output.py --input ../assets/messy.csv --output output.csv
```

---

## 📁 Project Structure

```
├── ui-tests/           # Playwright UI E2E tests
│   ├── pages/          # Page Object Model
│   └── tests/          # Test specs
├── api-tests/          # API/network-level tests
├── data-validation/    # Python data validation scripts
├── assets/             # Test data (messy.csv)
├── test-strategy.md    # Test strategy & flaky test analysis
└── ci-design.md        # CI/CD pipeline design
```

---

## 📚 Documentation

| Document                               | Description                                           |
| -------------------------------------- | ----------------------------------------------------- |
| [test-strategy.md](./test-strategy.md) | Test strategy, risk analysis, and flaky test handling |
| [ci-design.md](./ci-design.md)         | CI/CD pipeline design with GitHub Actions             |

---

## ❌ What's NOT Automated (By Design)

| Area                            | Reason                                                        |
| ------------------------------- | ------------------------------------------------------------- |
| AI-generated content validation | Non-deterministic outputs; we validate structure, not content |
| Visual regression testing       | Low ROI for a data-focused application                        |
| Performance/load testing        | Requires production-like infrastructure                       |
| Mobile responsiveness           | Desktop-first application based on user personas              |

These are intentional trade-offs prioritizing **test reliability** and **maintenance cost** over comprehensive but fragile coverage.

---

## 🎥 Demo Video

[📹 Watch Demo](#) _(Coming Soon)_

Covers:

- UI test walkthrough
- API test explanation
- Data validation demonstration
- Design decisions

---

## 🔧 Alternative Setup

If you prefer the interactive Playwright setup wizard:

```bash
npm init playwright@latest
```

This project uses a manual setup for more control over configuration.

---

## ⚙️ Configuration

### Environment Variables

Create `.env` from the template:

```bash
cp .env.example .env
```

Required variables:

- `RHOMBUS_EMAIL` - Your Rhombus AI account email
- `RHOMBUS_PASSWORD` - Your Rhombus AI account password

---

## 📊 Test Reports

After running tests:

```bash
npm run report
```

Reports are saved to `playwright-report/` with:

- HTML report
- Screenshots on failure
- Video recordings on failure
- Trace files for debugging

---

**Built with [Playwright](https://playwright.dev) • TypeScript • Python**
