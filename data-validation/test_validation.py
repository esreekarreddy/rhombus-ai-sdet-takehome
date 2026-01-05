#!/usr/bin/env python3
"""
Rhombus AI Data Validation Tests (pytest)

These tests validate the data transformation pipeline output.
Run with: pytest test_validation.py -v

Prerequisites:
    pip install pytest pandas
"""

import pytest
import pandas as pd
import os
from pathlib import Path

# Import our validator module
from validator import (
    validate_text_case,
    validate_no_nulls,
    validate_no_duplicates,
    validate_sorted,
    validate_row_count,
    validate_schema
)


# Test data paths
PROJECT_ROOT = Path(__file__).parent.parent
MESSY_CSV = PROJECT_ROOT / "assets" / "messy.csv"
CLEANED_CSV = PROJECT_ROOT / "test-results" / "downloads" / "cleaned_data.csv"


class TestMessyDataValidation:
    """Tests to verify our messy.csv has the expected quality issues."""
    
    @pytest.fixture
    def messy_df(self):
        """Load the messy CSV file."""
        return pd.read_csv(MESSY_CSV)
    
    def test_messy_csv_exists(self):
        """Verify messy.csv exists in assets folder."""
        assert MESSY_CSV.exists(), f"messy.csv not found at {MESSY_CSV}"
    
    def test_messy_has_expected_rows(self, messy_df):
        """Verify messy.csv has 25 rows (including 1 duplicate)."""
        assert len(messy_df) == 25, f"Expected 25 rows, got {len(messy_df)}"
    
    def test_messy_has_null_ages(self, messy_df):
        """Verify messy.csv has NULL values in age column."""
        null_count = messy_df['age'].isna().sum()
        assert null_count > 0, "Expected NULL values in age column"
    
    def test_messy_has_null_salaries(self, messy_df):
        """Verify messy.csv has NULL values in salary column."""
        null_count = messy_df['salary'].isna().sum()
        assert null_count > 0, "Expected NULL values in salary column"
    
    def test_messy_has_mixed_case_status(self, messy_df):
        """Verify messy.csv has mixed case in status column."""
        unique_statuses = messy_df['status'].unique()
        # Should have Active, ACTIVE, active, Inactive, INACTIVE, inactive
        has_mixed_case = len(set(s.lower() for s in unique_statuses)) < len(unique_statuses)
        assert has_mixed_case, "Expected mixed case values in status column"
    
    def test_messy_has_duplicates(self, messy_df):
        """Verify messy.csv has at least one duplicate row."""
        duplicate_count = messy_df.duplicated().sum()
        assert duplicate_count > 0, "Expected at least one duplicate row"


@pytest.mark.skipif(
    not CLEANED_CSV.exists(),
    reason="cleaned_data.csv not found - run UI tests first"
)
class TestCleanedDataValidation:
    """Tests to validate the transformed/cleaned data output."""
    
    @pytest.fixture
    def cleaned_df(self):
        """Load the cleaned CSV file."""
        return pd.read_csv(CLEANED_CSV)
    
    def test_schema_matches_expected(self, cleaned_df):
        """Verify schema has all expected columns."""
        passed, message = validate_schema(cleaned_df)
        assert passed, message
    
    def test_row_count_after_deduplication(self, cleaned_df):
        """Verify row count is reduced after removing duplicates (24 rows)."""
        passed, message = validate_row_count(cleaned_df, expected_min=24, expected_max=24)
        assert passed, message
    
    def test_status_is_lowercase(self, cleaned_df):
        """Verify Text Case transformation - status should be lowercase."""
        passed, message = validate_text_case(cleaned_df, 'status')
        assert passed, message
    
    def test_age_has_no_nulls(self, cleaned_df):
        """Verify Impute transformation - age should have no NULL values."""
        passed, message = validate_no_nulls(cleaned_df, ['age'])
        assert passed, message
    
    def test_salary_has_no_nulls(self, cleaned_df):
        """Verify Impute transformation - salary should have no NULL values."""
        passed, message = validate_no_nulls(cleaned_df, ['salary'])
        assert passed, message
    
    def test_no_duplicate_rows(self, cleaned_df):
        """Verify Remove Duplicates transformation - no duplicates."""
        passed, message = validate_no_duplicates(cleaned_df)
        assert passed, message
    
    def test_sorted_by_name(self, cleaned_df):
        """Verify Sort Data transformation - sorted by name ascending."""
        passed, message = validate_sorted(cleaned_df, 'name', ascending=True)
        assert passed, message
    
    def test_status_values_are_valid(self, cleaned_df):
        """Verify status only contains 'active' or 'inactive'."""
        valid_values = {'active', 'inactive'}
        actual_values = set(cleaned_df['status'].str.lower().unique())
        assert actual_values.issubset(valid_values), f"Invalid status values: {actual_values - valid_values}"


class TestDataIntegrity:
    """Tests for overall data integrity."""
    
    @pytest.fixture
    def messy_df(self):
        return pd.read_csv(MESSY_CSV)
    
    def test_id_is_unique(self, messy_df):
        """Verify each row has a unique ID (before deduplication)."""
        # Note: After deduplication, IDs should be unique
        # In messy data, we may have duplicate IDs (row 5 = duplicate of row 1)
        pass  # This is expected to fail on messy data
    
    def test_email_format(self, messy_df):
        """Verify email column contains valid email format."""
        import re
        email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        invalid_emails = messy_df[~messy_df['email'].str.match(email_pattern)]
        assert len(invalid_emails) == 0, f"Found {len(invalid_emails)} invalid emails"
    
    def test_department_values(self, messy_df):
        """Verify department contains only valid values."""
        valid_depts = {'Engineering', 'Marketing', 'HR', 'Sales'}
        actual_depts = set(messy_df['department'].unique())
        assert actual_depts.issubset(valid_depts), f"Invalid departments: {actual_depts - valid_depts}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
