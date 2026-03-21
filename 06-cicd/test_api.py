"""API tests for Hospital Readmission Risk FastAPI service.

Requires the server running (e.g. python app.py or Docker on port 9696).
"""
import requests

BASE_URL = "http://localhost:9696"

SAMPLE_PATIENT = {
    "time_in_hospital": 3,
    "num_lab_procedures": 41,
    "num_procedures": 0,
    "num_medications": 8,
    "number_emergency": 0,
    "number_inpatient": 0,
    "number_outpatient": 0,
    "number_diagnoses": 9,
    "care_intensity": 0,
    "admission_type_id": 1,
    "discharge_disposition_id": 1,
    "admission_source_id": 7,
    "age": "[50-60)",
    "gender": "Female",
    "race": "Caucasian",
    "change": "Ch",
    "diabetesMed": "Yes",
    "medication_changed": 1,
    "A1Cresult": "not_tested",
    "max_glu_serum": "not_tested",
}


def test_health_endpoint():
    resp = requests.get(f"{BASE_URL}/health")
    assert resp.status_code == 200, (
        f"Unexpected status: {resp.status_code} body={resp.text}"
    )
    data = resp.json()
    assert data.get("status") == "ok"
    assert data.get("model_loaded") is True, "Model must be loaded for deployment"
    assert isinstance(data.get("run_id"), str) and len(data["run_id"]) > 5


def test_predict_endpoint():
    resp = requests.post(f"{BASE_URL}/predict", json=SAMPLE_PATIENT)
    assert resp.status_code == 200, (
        f"Unexpected status: {resp.status_code} body={resp.text}"
    )
    data = resp.json()

    assert "risk_score" in data and "model_version" in data
    assert isinstance(data["risk_score"], float)
    assert 0 <= data["risk_score"] <= 1
    assert isinstance(data["model_version"], str) and len(data["model_version"]) > 5
