#!/usr/bin/env python3
"""
Rhombus AI Data Validation Script

This script validates the transformed data output from the Rhombus AI pipeline.
It compares the cleaned data against expected transformations:
1. Text Case - status column should be lowercase
2. Impute - no NULL values in age/salary columns
3. Remove Duplicates - no duplicate rows
4. Sort Data - rows sorted by name (ascending)

Usage:
    python validator.py <path_to_cleaned_csv>
    
Example:
    python validator.py ../test-results/downloads/cleaned_data.csv
"""

import pandas as pd
import sys
import os
from typing import Tuple, List, Dict, Any


def load_csv(filepath: str) -> pd.DataFrame:
    """Load a CSV file into a pandas DataFrame."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")
    return pd.read_csv(filepath)


def validate_text_case(df: pd.DataFrame, column: str = 'status') -> Tuple[bool, str]:
    """
    Validate Text Case transformation.
    All values in the specified column should be lowercase.
    """
    if column not in df.columns:
        return False, f"Column '{column}' not found in dataset"
    
    # Check if all values are lowercase
    non_lowercase = df[df[column].str.lower() != df[column]]
    
    if len(non_lowercase) > 0:
        return False, f"Found {len(non_lowercase)} rows with non-lowercase {column}"
    
    return True, f"✓ All {column} values are lowercase"


def validate_no_nulls(df: pd.DataFrame, columns: List[str] = ['age', 'salary']) -> Tuple[bool, str]:
    """
    Validate Impute transformation.
    Specified columns should have no NULL/NaN values.
    """
    results = []
    all_valid = True
    
    for col in columns:
        if col not in df.columns:
            results.append(f"Column '{col}' not found")
            all_valid = False
            continue
            
        null_count = df[col].isna().sum()
        if null_count > 0:
            results.append(f"✗ {col}: {null_count} NULL values found")
            all_valid = False
        else:
            results.append(f"✓ {col}: No NULL values")
    
    return all_valid, "\n".join(results)


def validate_no_duplicates(df: pd.DataFrame) -> Tuple[bool, str]:
    """
    Validate Remove Duplicates transformation.
    No duplicate rows should exist.
    """
    duplicates = df.duplicated()
    duplicate_count = duplicates.sum()
    
    if duplicate_count > 0:
        return False, f"✗ Found {duplicate_count} duplicate rows"
    
    return True, f"✓ No duplicate rows (total: {len(df)} rows)"


def validate_sorted(df: pd.DataFrame, column: str = 'name', ascending: bool = True) -> Tuple[bool, str]:
    """
    Validate Sort Data transformation.
    Rows should be sorted by the specified column.
    """
    if column not in df.columns:
        return False, f"Column '{column}' not found in dataset"
    
    sorted_values = df[column].sort_values(ascending=ascending).reset_index(drop=True)
    actual_values = df[column].reset_index(drop=True)
    
    if sorted_values.equals(actual_values):
        direction = "ascending" if ascending else "descending"
        return True, f"✓ Data is sorted by {column} ({direction})"
    
    return False, f"✗ Data is NOT sorted by {column}"


def validate_row_count(df: pd.DataFrame, expected_min: int = 24, expected_max: int = 25) -> Tuple[bool, str]:
    """
    Validate row count is within expected range.
    Original: 25 rows, after removing 1 duplicate: 24 rows
    """
    actual = len(df)
    
    if expected_min <= actual <= expected_max:
        return True, f"✓ Row count: {actual} (expected {expected_min}-{expected_max})"
    
    return False, f"✗ Row count: {actual} (expected {expected_min}-{expected_max})"


def validate_schema(df: pd.DataFrame) -> Tuple[bool, str]:
    """
    Validate the output schema matches expected columns.
    """
    expected_columns = {'id', 'name', 'email', 'age', 'salary', 'department', 'status'}
    actual_columns = set(df.columns)
    
    if expected_columns == actual_columns:
        return True, f"✓ Schema matches: {len(actual_columns)} columns"
    
    missing = expected_columns - actual_columns
    extra = actual_columns - expected_columns
    
    msg = "✗ Schema mismatch:"
    if missing:
        msg += f"\n  Missing: {missing}"
    if extra:
        msg += f"\n  Extra: {extra}"
    
    return False, msg


def run_all_validations(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Run all validation checks and return results.
    """
    results = {
        'schema': validate_schema(df),
        'row_count': validate_row_count(df),
        'text_case': validate_text_case(df, 'status'),
        'no_nulls': validate_no_nulls(df, ['age', 'salary']),
        'no_duplicates': validate_no_duplicates(df),
        'sorted': validate_sorted(df, 'name', ascending=True),
    }
    
    return results


def print_report(results: Dict[str, Any]) -> bool:
    """
    Print validation report and return overall pass/fail.
    """
    print("\n" + "=" * 60)
    print("RHOMBUS AI DATA VALIDATION REPORT")
    print("=" * 60 + "\n")
    
    all_passed = True
    
    for check_name, (passed, message) in results.items():
        status = "PASS" if passed else "FAIL"
        print(f"[{status}] {check_name.upper()}")
        print(f"       {message}\n")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("OVERALL: ✓ ALL VALIDATIONS PASSED")
    else:
        print("OVERALL: ✗ SOME VALIDATIONS FAILED")
    print("=" * 60 + "\n")
    
    return all_passed


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python validator.py <path_to_cleaned_csv>")
        print("Example: python validator.py ../test-results/downloads/cleaned_data.csv")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    try:
        print(f"\nLoading: {filepath}")
        df = load_csv(filepath)
        print(f"Loaded {len(df)} rows, {len(df.columns)} columns")
        
        results = run_all_validations(df)
        all_passed = print_report(results)
        
        sys.exit(0 if all_passed else 1)
        
    except Exception as e:
        print(f"\nERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
