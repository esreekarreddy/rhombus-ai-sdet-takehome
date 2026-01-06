# Rhombus AI – SDET Take-Home Exercise

Automated test suite for [Rhombus AI](https://rhombusai.com) using Playwright with TypeScript and Python.

## Quick Start

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

> **Note:** Tests require valid Rhombus AI credentials.

---

## Running Tests

| Command               | Description               |
| --------------------- | ------------------------- |
| `npm test`            | Run all tests             |
| `npm run test:ui`     | UI end-to-end tests only  |
| `npm run test:api`    | Run API tests only        |
| `npm run test:smoke`  | Smoke tests only (fast)   |
| `npm run test:headed` | Run with visible browser  |
| `npm run test:debug`  | Debug mode (step through) |
| `npm run report`      | Open HTML test report     |

---

## Data Validation (Python)

I built a separate data validation layer using Python and pandas:

```bash
# Run the automated validation suite (pytest)
npm run test:validation

# Run manual validation on the output file
npm run validate:csv
```

### Manual Setup (Optional)

```bash
cd data-validation
pip install -r requirements.txt

# Validate cleaned output
python validator.py ../test-results/downloads/cleaned_data.csv

# Run pytest suite
pytest test_validation.py -v
```

---

## Project Structure

```
├── ui-tests/                   # Playwright UI tests
│   ├── pages/                  # Page Object Model
│   │   ├── BasePage.ts         # Abstract base class
│   │   ├── LoginPage.ts        # Authentication via Auth0
│   │   ├── DashboardPage.ts    # Project management
│   │   └── CanvasPage.ts       # Transformation workflow
│   └── tests/
│       ├── auth.setup.ts       # Shared authentication setup
│       └── manual-transformation-flow.spec.ts
│
├── api-tests/                  # API / network-level tests
│   ├── README.md               # API testing approach & discovered endpoints
│   ├── auth.spec.ts            # Session & unauthorized access tests
│   ├── pipeline.spec.ts        # Project list via network interception
│   └── upload.spec.ts          # File upload validation
│
├── data-validation/            # Python data validation
│   ├── README.md               # Validation approach
│   ├── validator.py            # Standalone CLI validator
│   ├── test_validation.py      # Pytest test suite
│   └── requirements.txt
│
├── tools/                      # Development utilities
│   └── network-sniffer.ts      # HAR capture for endpoint discovery
│
├── assets/
│   └── messy.csv               # Test input (25 rows)
│
├── test-results/               # Generated output
│   ├── downloads/              # Cleaned CSV files
│   └── screenshots/            # Step-by-step captures
│
├── test-strategy.md            # Test strategy document
├── ci-design.md                # CI/CD pipeline design
├── playwright.config.ts        # Playwright configuration
└── package.json                # NPM scripts & dependencies
```

---

## Transformation Pipeline

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

## Demo Video

> **Link:** [Coming soon - will be added upon final submission]

---

## What I Chose NOT to Automate

These are deliberate decisions based on automation ROI:

| Area                    | Reason                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Pipeline Flow**    | I chose Option B (Manual Transformation) to ensure deterministic, reliable tests. AI mode introduces non-determinism that requires different assertion strategies.  |
| **Visual Regression**   | For a data transformation tool, functional correctness matters more than pixel-perfect UI. Visual tests have high maintenance cost with low bug-finding value here. |
| **Performance Testing** | Requires production-equivalent infrastructure and baseline data. I documented this as a future enhancement in the test strategy.                                    |
| **All 19 Transformers** | Diminishing returns. I covered the 4 highest-risk transformers and documented how to extend coverage.                                                               |

---

## Test Reports

```bash
npm run report
```

Reports include:

- HTML report with test results
- Attached screenshots for each transformation step
- Video recordings on failure
- Trace files for debugging

---

## Configuration

```bash
cp .env.example .env
```

Required:

- `RHOMBUS_EMAIL` - Your Rhombus AI account email
- `RHOMBUS_PASSWORD` - Your Rhombus AI account password

---

## Documentation

| Document                                                 | Description                   |
| -------------------------------------------------------- | ----------------------------- |
| [test-strategy.md](./test-strategy.md)                   | Test strategy & risk analysis |
| [ci-design.md](./ci-design.md)                           | CI/CD pipeline design         |
| [api-tests/README.md](./api-tests/README.md)             | API testing approach          |
| [data-validation/README.md](./data-validation/README.md) | Data validation approach      |

---

**Built with [Playwright](https://playwright.dev) • TypeScript • Python • Pandas**
