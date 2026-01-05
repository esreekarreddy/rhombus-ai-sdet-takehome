# Rhombus AI – SDET Take-Home Exercise

Automated test suite for [Rhombus AI](https://rhombusai.com) using Playwright with TypeScript and Python.

## 📋 Quick Start

```bash
# Install dependencies
npm install
npx playwright install

# Configure credentials
cp .env.example .env
# Edit .env with your Rhombus AI credentials

# Run tests
npm test
```

> **Note:** Tests require valid Rhombus AI credentials. Sign up free at https://rhombusai.com

---

## 🧪 Running Tests

| Command               | Description               |
| --------------------- | ------------------------- |
| `npm test`            | Run all tests             |
| `npm run test:ui`     | UI end-to-end tests only  |
| `npm run test:smoke`  | Smoke tests only (fast)   |
| `npm run test:headed` | Run with visible browser  |
| `npm run test:debug`  | Debug mode (step through) |
| `npm run report`      | Open HTML test report     |

---

## 🔬 Data Validation (Python)

```bash
cd data-validation
pip install -r requirements.txt

# Validate cleaned output
python validator.py ../test-results/downloads/cleaned_data.csv

# Run pytest suite
pytest test_validation.py -v
```

---

## 📁 Project Structure

```
├── ui-tests/               # Playwright UI tests (Part 2)
│   ├── pages/              # Page Object Model
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   └── CanvasPage.ts
│   └── tests/
│       └── manual-transformation-flow.spec.ts
├── api-tests/              # API tests (Part 3) - Coming soon
├── data-validation/        # Python validation (Part 4)
│   ├── validator.py
│   └── test_validation.py
├── assets/
│   └── messy.csv           # Test input data (25 rows)
├── test-results/
│   ├── downloads/          # Output CSV files
│   └── screenshots/        # Step-by-step screenshots
├── test-strategy.md        # Test strategy (Part 1)
└── ci-design.md            # CI/CD design (Part 5)
```

---

## 🔄 Transformation Pipeline

| Step | Transformation    | Configuration            |
| ---- | ----------------- | ------------------------ |
| 1    | Data Input        | Upload messy.csv         |
| 2    | Text Case         | status → lowercase       |
| 3    | Impute            | Fill NULL in age, salary |
| 4    | Remove Duplicates | All columns              |
| 5    | Sort Data         | By name (ascending)      |
| 6    | Download          | Export cleaned_data.csv  |

**Input:** 25 rows with NULL values, mixed case, 1 duplicate  
**Output:** 24 rows, cleaned and sorted

---

## 🎬 Demo Video

> **Link:** [Coming soon - will be added upon final submission]

---

## 🚧 What I Chose NOT to Test (Yet)

1. **AI Pipeline Flow** – Chose Option B (Manual Transformation) for deterministic, reliable tests
2. **Visual Regression** – Low ROI for a data-heavy application; functionality > appearance
3. **Performance Testing** – Requires production-like infrastructure; functional correctness is higher priority
4. **Exact AI Output Validation** – AI outputs are probabilistic; testing structure not exact values

---

## 📊 Test Reports

```bash
npm run report
```

Reports include:

- HTML report with test results
- Attached screenshots for each transformation step
- Video recordings on failure
- Trace files for debugging

---

## ⚙️ Configuration

```bash
cp .env.example .env
```

Required:

- `RHOMBUS_EMAIL` - Your Rhombus AI account email
- `RHOMBUS_PASSWORD` - Your Rhombus AI account password

---

## 📚 Documentation

| Document                               | Description                   |
| -------------------------------------- | ----------------------------- |
| [test-strategy.md](./test-strategy.md) | Test strategy & risk analysis |
| [ci-design.md](./ci-design.md)         | CI/CD pipeline design         |

---

**Built with [Playwright](https://playwright.dev) • TypeScript • Python • Pandas**
