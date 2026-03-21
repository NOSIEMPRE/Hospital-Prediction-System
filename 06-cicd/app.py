"""FastAPI service for Hospital Readmission Risk Prediction.

Model baked into Docker image: models/model/, run_id.txt.
Aligns with 04/05: full FEATURE_COLS schema.
Added features: Strict Literal type checking, X-Request-ID tracing, and Prediction Logging.
"""

from __future__ import annotations

import datetime
import logging
import numpy as np
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Literal, Optional

import mlflow.sklearn
import yaml
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, model_validator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

_SCRIPT_DIR = Path(__file__).resolve().parent
_CONFIG_PATH = _SCRIPT_DIR / "config.yaml"

RUN_ID: Optional[str] = None
model: Optional[Any] = None


def _load_api_config() -> dict:
    """Load API section from config.yaml, with safe defaults."""
    if _CONFIG_PATH.exists():
        with open(_CONFIG_PATH, encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        return cfg.get("api", {})
    return {}


class PredictionLogger:
    """Appends predictions to a CSV for downstream monitoring."""

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text(
                "ts,request_id,risk_score,model_version\n"
            )

    def log(
        self,
        request_id: str,
        risk_score: float,
        model_version: str,
    ) -> None:
        ts = datetime.datetime.utcnow().isoformat()
        with open(self.path, "a") as f:
            f.write(f"{ts},{request_id},{risk_score},{model_version}\n")


prediction_logger: Optional[PredictionLogger] = None


class PatientRequest(BaseModel):
    """Request body for /predict. Must match train.py FEATURE_COLS."""

    time_in_hospital: int = Field(..., ge=1, le=14, description="Days in hospital")
    num_lab_procedures: int = Field(..., ge=0, description="Number of lab procedures")
    num_procedures: int = Field(..., ge=0, description="Number of procedures")
    num_medications: int = Field(..., ge=0, description="Number of medications")
    number_emergency: int = Field(..., ge=0, description="Emergency visits (prior year)")
    number_inpatient: int = Field(..., ge=0, description="Inpatient visits (prior year)")
    number_outpatient: int = Field(..., ge=0, description="Outpatient visits (prior year)")
    number_diagnoses: int = Field(..., ge=0, description="Number of diagnoses")
    care_intensity: Optional[int] = Field(None, ge=0, description="Sum of emergency+inpatient+outpatient")
    admission_type_id: int = Field(..., ge=1, description="Admission type ID")
    discharge_disposition_id: int = Field(..., ge=1, description="Discharge disposition ID")
    admission_source_id: int = Field(..., ge=1, description="Admission source ID")
    
    # Strict enum typing block invalid inputs before they hit the model
    age: Literal[
        "[0-10)", "[10-20)", "[20-30)", "[30-40)", "[40-50)",
        "[50-60)", "[60-70)", "[70-80)", "[80-90)", "[90-100)"
    ] = Field(..., description="Age group, e.g. [50-60)")
    gender: Literal["Female", "Male", "Unknown", "Unknown/Invalid"] = Field(..., description="Gender")
    race: Literal["Caucasian", "AfricanAmerican", "Asian", "Hispanic", "Other", "Unknown"] = Field(..., description="Race")
    change: Literal["No", "Ch"] = Field(default="No", description="Medication change: No, Ch")
    diabetesMed: Literal["No", "Yes"] = Field(default="No", description="Diabetes medication: Yes, No")
    medication_changed: Optional[int] = Field(None, ge=0, le=1, description="1 if change==Ch else 0")
    A1Cresult: Literal["not_tested", "None", "Norm", ">7", ">8"] = Field(default="not_tested", description="HbA1c result")
    max_glu_serum: Literal["not_tested", "None", "Norm", ">200", ">300"] = Field(default="not_tested", description="Max glucose serum")

    @model_validator(mode="after")
    def _auto_compute_derived(self) -> "PatientRequest":
        """Auto-compute derived fields if the caller didn't provide them."""
        if self.care_intensity is None:
            self.care_intensity = (
                self.number_emergency + self.number_inpatient + self.number_outpatient
            )
        if self.medication_changed is None:
            self.medication_changed = 1 if self.change == "Ch" else 0
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "time_in_hospital": 3,
                "num_lab_procedures": 41,
                "num_procedures": 0,
                "num_medications": 8,
                "number_emergency": 0,
                "number_inpatient": 0,
                "number_outpatient": 0,
                "number_diagnoses": 9,
                "admission_type_id": 1,
                "discharge_disposition_id": 1,
                "admission_source_id": 7,
                "age": "[50-60)",
                "gender": "Female",
                "race": "Caucasian",
                "change": "Ch",
                "diabetesMed": "Yes",
                "A1Cresult": "not_tested",
                "max_glu_serum": "not_tested",
            }
        }
    )


class PredictionResponse(BaseModel):
    risk_score: float
    model_version: str
    shap_values: Optional[dict[str, float]] = None
    base_value: Optional[float] = None
    
    model_config = ConfigDict(protected_namespaces=())


@asynccontextmanager
async def lifespan(app: FastAPI):
    global RUN_ID, model, prediction_logger

    api_cfg = _load_api_config()
    run_id_file = api_cfg.get("run_id_file", "run_id.txt")
    model_dir = api_cfg.get("model_dir", "models/model")
    
    # Initialize prediction logger
    log_path = _SCRIPT_DIR / "data" / "predictions.log"
    prediction_logger = PredictionLogger(log_path)
    logger.info("Prediction logging initialized at %s", log_path)

    run_id_path = Path(run_id_file)
    if run_id_path.exists():
        RUN_ID = run_id_path.read_text().strip()
        logger.info("Found run_id: %s", RUN_ID)
    else:
        logger.warning("run_id.txt not found – health will report 'unknown'.")
        RUN_ID = None

    model_path = Path(model_dir)
    if model_path.exists():
        try:
            model = mlflow.sklearn.load_model(str(model_path))
            logger.info("Model loaded from %s", model_path)
        except Exception as e:
            logger.error("Failed to load model: %s", e)
            model = None
    else:
        logger.error("Model directory not found: %s", model_path)
        model = None

    yield


app = FastAPI(
    title="Hospital Readmission Risk Predictor",
    description="Predict 30-day readmission risk for diabetic inpatients with Explainable AI.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Tracing middleware: adds X-Request-ID and execution time logs."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-Ms"] = f"{elapsed_ms:.1f}"
    logger.info(
        "%s %s -> %d (%.1fms) [%s]",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
        request_id,
    )
    return response


@app.get("/")
def root():
    return {"message": "Welcome to the Hospital Readmission Risk prediction API"}


@app.get("/health")
def health():
    return {
        "status": "ok" if model is not None else "degraded",
        "run_id": RUN_ID or "unknown",
        "model_loaded": model is not None,
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(patient: PatientRequest, request: Request):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Check /health.")
    try:
        feature_dict = patient.model_dump()
        pred_proba = model.predict_proba([feature_dict])[0, 1]
        
        # Calculate Explainable AI (SHAP)
        shap_output = None
        base_value = None
        try:
            import shap
            vectorizer = model.named_steps["vectorizer"]
            classifier = model.named_steps["classifier"]
            
            # Extract features as dict for SHAP calculation
            feature_matrix = vectorizer.transform([feature_dict]).toarray()
            explainer = shap.TreeExplainer(classifier)
            shap_result = explainer.shap_values(feature_matrix)
            
            # Extract SHAP values - handle different SHAP output formats (v0.4x)
            if isinstance(shap_result, list):
                # Binary classification often returns [neg_class_shap, pos_class_shap]
                shap_raw = shap_result[1][0] if len(shap_result) > 1 else shap_result[0][0]
            elif isinstance(shap_result, np.ndarray) and len(shap_result.shape) == 3:
                # Some versions return (n_samples, n_features, n_classes)
                shap_raw = shap_result[0, :, 1] if shap_result.shape[2] > 1 else shap_result[0, :, 0]
            else:
                shap_raw = shap_result[0]
            
            # Extract base value appropriately
            expected_val = explainer.expected_value
            if isinstance(expected_val, (list, tuple, np.ndarray)):
                expected_val = expected_val[-1]
            base_value = float(expected_val)
            
            # Map back to semantic feature names
            feature_names = vectorizer.dv.get_feature_names_out()
            shap_dict = {str(k): float(v) for k, v in zip(feature_names, shap_raw) if abs(v) > 0.001}
            shap_output = shap_dict
        except Exception as e:
            logger.warning("SHAP calculation skipped: %s", e)
            
        # Log to data exhaust 
        request_id = request.headers.get("X-Request-ID", "unknown")
        if prediction_logger is not None:
            prediction_logger.log(
                request_id=request_id,
                risk_score=float(pred_proba),
                model_version=RUN_ID or "unknown",
            )

        return PredictionResponse(
            risk_score=float(pred_proba),
            model_version=RUN_ID or "unknown",
            shap_values=shap_output,
            base_value=base_value
        )
    except Exception as e:
        logger.error("Prediction failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")

@app.post("/predict/batch", response_model=list[PredictionResponse])
def predict_batch(patients: list[PatientRequest], request: Request):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Check /health.")
    results = []
    for patient in patients:
        try:
            # Reusing main logic simplified since SHAP per-row in batch is heavy, but supported here
            feature_dict = patient.model_dump()
            pred_proba = model.predict_proba([feature_dict])[0, 1]
            
            # Simple shap for batch
            shap_output = None
            try:
                import shap
                vectorizer = model.named_steps["vectorizer"]
                classifier = model.named_steps["classifier"]
                feature_matrix = vectorizer.transform([feature_dict]).toarray()
                explainer = shap.TreeExplainer(classifier)
                shap_result = explainer.shap_values(feature_matrix)
                
                # Extract SHAP values - handle different SHAP output formats (v0.4x)
                if isinstance(shap_result, list):
                    shap_raw = shap_result[1][0] if len(shap_result) > 1 else shap_result[0][0]
                elif isinstance(shap_result, np.ndarray) and len(shap_result.shape) == 3:
                    shap_raw = shap_result[0, :, 1] if shap_result.shape[2] > 1 else shap_result[0, :, 0]
                else:
                    shap_raw = shap_result[0]

                feature_names = vectorizer.dv.get_feature_names_out()
                shap_dict = {str(k): float(v) for k, v in zip(feature_names, shap_raw) if abs(v) > 0.001}
                shap_output = shap_dict
            except:
                pass

            results.append(PredictionResponse(
                risk_score=float(pred_proba),
                model_version=RUN_ID or "unknown",
                shap_values=shap_output,
                base_value=None
            ))
        except Exception as e:
            logger.warning("Batch prediction item failed: %s", e)
            results.append(PredictionResponse(risk_score=0.0, model_version="error"))
            
    return results


if __name__ == "__main__":
    import uvicorn

    api_cfg = _load_api_config()
    uvicorn.run(
        "app:app",
        host=api_cfg.get("host", "0.0.0.0"),
        port=api_cfg.get("port", 9696),
        reload=False,
    )
