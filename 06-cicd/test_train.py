"""Unit tests for train.py core functions.

Tests run without a live server; they validate data preprocessing,
feature extraction, and the DictVectorizerWrapper independently.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from sklearn.pipeline import Pipeline

from train import (
    FEATURE_COLS,
    DictVectorizerWrapper,
    prepare_features,
    read_data,
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

def _make_raw_df(n: int = 10) -> pd.DataFrame:
    """Return a minimal DataFrame matching the raw diabetic dataset format."""
    return pd.DataFrame(
        {
            "patient_nbr": range(n),
            "readmitted": ["<30"] * 3 + ["NO"] * (n - 3),
            "time_in_hospital": [3] * n,
            "num_lab_procedures": [41] * n,
            "num_procedures": [0] * n,
            "num_medications": [8] * n,
            "number_emergency": [0] * n,
            "number_inpatient": [1] * n,
            "number_outpatient": [2] * n,
            "number_diagnoses": [9] * n,
            "admission_type_id": [1] * n,
            "discharge_disposition_id": [1] * n,
            "admission_source_id": [7] * n,
            "age": ["[50-60)"] * n,
            "gender": ["Female"] * n,
            "race": ["Caucasian"] * n,
            "change": ["Ch"] * n,
            "diabetesMed": ["Yes"] * n,
            "A1Cresult": ["None"] * n,
            "max_glu_serum": ["None"] * n,
            # columns that should be handled / dropped
            "weight": ["?"] * n,
            "medical_specialty": ["?"] * n,
            "payer_code": [None] * n,
        }
    )


@pytest.fixture
def raw_csv(tmp_path) -> object:
    """Write a minimal raw CSV and return its Path."""
    df = _make_raw_df(n=10)
    path = tmp_path / "diabetic_data.csv"
    df.to_csv(path, index=False)
    return path


# ── read_data tests ───────────────────────────────────────────────────────────

def test_read_data_raises_on_missing_file(tmp_path):
    """FileNotFoundError is raised when the data file does not exist."""
    with pytest.raises(FileNotFoundError):
        read_data(tmp_path / "nonexistent.csv")


def test_read_data_drops_weight_column(raw_csv):
    """The 'weight' column (96%+ missing in real data) must be removed."""
    result = read_data(raw_csv, limit=None)
    assert "weight" not in result.columns


def test_read_data_creates_binary_target(raw_csv):
    """Target column must contain only 0 and 1."""
    result = read_data(raw_csv, limit=None)
    assert "target" in result.columns
    assert set(result["target"].unique()).issubset({0, 1})


def test_read_data_target_positive_rate(raw_csv):
    """3 out of 10 rows are '<30' readmissions, so positive rate should be 0.3."""
    result = read_data(raw_csv, limit=None)
    assert result["target"].mean() == pytest.approx(0.3)


def test_read_data_creates_care_intensity(raw_csv):
    """care_intensity must equal emergency + inpatient + outpatient."""
    result = read_data(raw_csv, limit=None)
    assert "care_intensity" in result.columns
    expected = (
        result["number_emergency"]
        + result["number_inpatient"]
        + result["number_outpatient"]
    )
    pd.testing.assert_series_equal(
        result["care_intensity"],
        expected,
        check_names=False,
    )


def test_read_data_creates_medication_changed(raw_csv):
    """medication_changed must be 1 when change=='Ch', else 0."""
    result = read_data(raw_csv, limit=None)
    assert "medication_changed" in result.columns
    expected = (result["change"] == "Ch").astype(int)
    pd.testing.assert_series_equal(
        result["medication_changed"],
        expected,
        check_names=False,
    )


def test_read_data_normalises_a1c_none_to_not_tested(raw_csv):
    """A1Cresult 'None' string should be normalised to 'not_tested'."""
    result = read_data(raw_csv, limit=None)
    assert "not_tested" in result["A1Cresult"].values


def test_read_data_limit_respected(raw_csv):
    """Limit parameter should cap the number of rows returned."""
    result = read_data(raw_csv, limit=5)
    assert len(result) == 5


# ── prepare_features tests ────────────────────────────────────────────────────

def _make_feature_df(n: int = 6) -> pd.DataFrame:
    """Return a DataFrame that already has all FEATURE_COLS present."""
    return pd.DataFrame(
        {
            "time_in_hospital": [3] * n,
            "num_lab_procedures": [41] * n,
            "num_procedures": [0] * n,
            "num_medications": [8] * n,
            "number_emergency": [0] * n,
            "number_inpatient": [1] * n,
            "number_outpatient": [2] * n,
            "number_diagnoses": [9] * n,
            "care_intensity": [3] * n,
            "admission_type_id": [1] * n,
            "discharge_disposition_id": [1] * n,
            "admission_source_id": [7] * n,
            "age": ["[50-60)"] * n,
            "gender": ["Female"] * n,
            "race": ["Caucasian"] * n,
            "change": ["Ch"] * n,
            "diabetesMed": ["Yes"] * n,
            "medication_changed": [1] * n,
            "A1Cresult": ["not_tested"] * n,
            "max_glu_serum": ["not_tested"] * n,
            "target": [1 if i < n // 2 else 0 for i in range(n)],
        }
    )


def test_prepare_features_returns_list_of_dicts():
    """X must be a list of dicts (one per row)."""
    df = _make_feature_df()
    X, _ = prepare_features(df)
    assert isinstance(X, list)
    assert all(isinstance(row, dict) for row in X)


def test_prepare_features_returns_numpy_target():
    """y must be a NumPy array with values in {0, 1}."""
    df = _make_feature_df()
    _, y = prepare_features(df)
    assert isinstance(y, np.ndarray)
    assert set(y.tolist()).issubset({0, 1})


def test_prepare_features_row_keys_match_feature_cols():
    """Each row dict must contain exactly the FEATURE_COLS present in the df."""
    df = _make_feature_df()
    X, _ = prepare_features(df)
    expected_keys = set(FEATURE_COLS) & set(df.columns)
    for row in X:
        assert set(row.keys()) == expected_keys


def test_prepare_features_correct_row_count():
    """Output length must match the number of DataFrame rows."""
    n = 8
    df = _make_feature_df(n=n)
    X, y = prepare_features(df)
    assert len(X) == n
    assert len(y) == n


# ── DictVectorizerWrapper tests ───────────────────────────────────────────────

def test_dict_vectorizer_wrapper_fit_transform():
    """Basic fit + transform should produce a 2-D sparse matrix."""
    dv = DictVectorizerWrapper()
    data = [
        {"age": "[50-60)", "num_lab_procedures": 41},
        {"age": "[60-70)", "num_lab_procedures": 30},
    ]
    dv.fit(data)
    result = dv.transform(data)
    assert result.shape[0] == 2
    assert result.shape[1] > 0


def test_dict_vectorizer_wrapper_fit_transform_combined():
    """fit_transform should produce the same shape as separate fit + transform."""
    dv1 = DictVectorizerWrapper()
    dv2 = DictVectorizerWrapper()
    data = [{"x": 1, "y": "a"}, {"x": 2, "y": "b"}]
    out1 = dv1.fit(data).transform(data)
    out2 = dv2.fit_transform(data)
    assert out1.shape == out2.shape


def test_dict_vectorizer_wrapper_in_pipeline():
    """DictVectorizerWrapper must be composable inside an sklearn Pipeline."""
    from sklearn.linear_model import LogisticRegression

    data = [
        {"num_medications": 5, "age": "[50-60)"},
        {"num_medications": 10, "age": "[60-70)"},
        {"num_medications": 3, "age": "[50-60)"},
    ]
    y = [1, 0, 1]
    pipe = Pipeline([
        ("vec", DictVectorizerWrapper()),
        ("clf", LogisticRegression()),
    ])
    pipe.fit(data, y)
    preds = pipe.predict(data)
    assert len(preds) == 3
