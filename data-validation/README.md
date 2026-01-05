# Data Validation Scripts

This directory contains Python scripts to validate the integrity and correctness of data transformed by the Rhombus AI pipeline.

## 📂 Contents

- **`validator.py`**: A standalone script to validate a specific CSV file against business rules.
- **`test_validation.py`**: A `pytest` test suite that verifies both the "messy" input data (to ensure it actually needs cleaning) and the "cleaned" output data.
- **`requirements.txt`**: Python dependencies.

## 🚀 Usage

### Option 1: Run via NPM (Recommended)

From the project root:

```bash
# Run the full validation test suite
npm run test:validation

# Run validation on the generated output file
npm run validate:csv
```

### Option 2: Run Directly with Python

Prerequisites:

```bash
pip install -r requirements.txt
```

**Run the validator:**

```bash
python validator.py <path_to_csv>

# Example:
python validator.py ../test-results/downloads/cleaned_data.csv
```

**Run the test suite:**

```bash
pytest -v
```

## 🔍 What is Validated?

The scripts verify the following transformations:

1.  **Text Case**: The `status` column must be lowercase.
2.  **Impute**: `age` and `salary` columns must have no NULL values.
3.  **Remove Duplicates**: The dataset must contain no duplicate rows.
4.  **Sort Data**: The dataset must be sorted by `name` (ascending).
5.  **Schema**: The output must contain all required columns.
6.  **Row Count**: The output row count must match the expected reduced count (after deduplication).
