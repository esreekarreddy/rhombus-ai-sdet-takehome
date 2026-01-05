# Data Validation

Python scripts for validating transformed data output from Rhombus AI.

## Setup

```bash
pip install -r requirements.txt
```

## Usage

### Command Line Validator

```bash
python validator.py ../test-results/downloads/cleaned_data.csv
```

**Output:**

```
[PASS] SCHEMA       - 7 columns present
[PASS] ROW_COUNT    - 24 rows (expected 24-25)
[PASS] TEXT_CASE    - All status values are lowercase
[PASS] NO_NULLS     - age: No NULL values, salary: No NULL values
[PASS] NO_DUPLICATES - No duplicate rows
[PASS] SORTED       - Data is sorted by name (ascending)

OVERALL: ✓ ALL VALIDATIONS PASSED
```

### Pytest Suite

```bash
pytest test_validation.py -v
```

## Validation Checks

| Check         | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| Schema        | 7 columns: id, name, email, age, salary, department, status |
| Row Count     | 24 rows (after removing 1 duplicate)                        |
| Text Case     | status column is lowercase                                  |
| No Nulls      | age and salary have no NULL values                          |
| No Duplicates | No duplicate rows exist                                     |
| Sorted        | Rows sorted by name (ascending)                             |

## Files

| File                 | Description                          |
| -------------------- | ------------------------------------ |
| `validator.py`       | Standalone validation script         |
| `test_validation.py` | Pytest test suite                    |
| `requirements.txt`   | Python dependencies (pandas, pytest) |
