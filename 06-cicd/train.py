"""Train Hospital Readmission Risk model and package for deployment.

CI/CD version: saves model to models/model/ for Docker build.
Aligns with 04/05: full FEATURE_COLS, patient-level split, scale_pos_weight.
"""

from __future__ import annotations

import logging
import shutil
from pathlib import Path

import mlflow
import mlflow.sklearn
import pandas as pd
import xgboost as xgb
import yaml
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction import DictVectorizer
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

_SCRIPT_DIR = Path(__file__).resolve().parent
_CONFIG_PATH = _SCRIPT_DIR / "config.yaml"

FEATURE_COLS = [
    "time_in_hospital",
    "num_lab_procedures",
    "num_procedures",
    "num_medications",
    "number_emergency",
    "number_inpatient",
    "number_outpatient",
    "number_diagnoses",
    "care_intensity",
    "admission_type_id",
    "discharge_disposition_id",
    "admission_source_id",
    "age",
    "gender",
    "race",
    "change",
    "diabetesMed",
    "medication_changed",
    "A1Cresult",
    "max_glu_serum",
]


def load_config() -> dict:
    """Load configuration from config.yaml."""
    if not _CONFIG_PATH.exists():
        raise FileNotFoundError(
            f"Config file not found at {_CONFIG_PATH}. "
            "Ensure config.yaml exists in the 06-cicd/ directory."
        )
    with open(_CONFIG_PATH) as f:
        return yaml.safe_load(f)


class DictVectorizerWrapper(BaseEstimator, TransformerMixin):
    """Sklearn-compatible wrapper around DictVectorizer."""

    def __init__(self):
        self.dv = DictVectorizer(sparse=True)

    def fit(self, X, y=None):
        self.dv.fit(X)
        return self

    def transform(self, X):
        return self.dv.transform(X)


def read_data(
    path: Path,
    seed: int = 42,
    limit: int | None = 50_000,
) -> pd.DataFrame:
    """Load and preprocess Diabetes 130-US Hospitals data."""
    if not path.exists():
        raise FileNotFoundError(
            f"Data not found at {path}. "
            "Download from UCI (https://archive.ics.uci.edu/dataset/296) "
            "and place diabetic_data.csv in data/"
        )
    logger.info("Loading raw data from %s ...", path)
    df = pd.read_csv(path)
    df["target"] = df["readmitted"].isin(["30", "<30"]).astype(int)
    if "weight" in df.columns:
        df = df.drop(columns=["weight"])
    for col in ["medical_specialty", "payer_code"]:
        if col in df.columns:
            df[col] = df[col].fillna("Unknown").replace("?", "Unknown")
    df["age"] = df["age"].fillna("[50-60)")
    df["gender"] = df["gender"].fillna("Unknown")
    df["change"] = df["change"].fillna("No")
    df["diabetesMed"] = df["diabetesMed"].fillna("No")
    for col in ["A1Cresult", "max_glu_serum"]:
        if col not in df.columns:
            df[col] = "not_tested"
        else:
            df[col] = (
                df[col].fillna("None").replace("None", "not_tested").astype(str)
            )
    if "race" in df.columns:
        df["race"] = (
            df["race"].fillna("Unknown").replace("?", "Unknown").astype(str)
        )
    for col in ["number_emergency", "number_inpatient", "number_outpatient"]:
        df[col] = (
            pd.to_numeric(df.get(col, 0), errors="coerce").fillna(0).astype(int)
        )
    df["care_intensity"] = (
        df["number_emergency"] + df["number_inpatient"] + df["number_outpatient"]
    )
    df["medication_changed"] = (df["change"] == "Ch").astype(int)
    for col in [
        "num_lab_procedures",
        "num_procedures",
        "num_medications",
        "number_diagnoses",
    ]:
        df[col] = (
            pd.to_numeric(df.get(col, 0), errors="coerce").fillna(0).astype(int)
        )
    if limit:
        df = df.sample(n=min(limit, len(df)), random_state=seed)
    logger.info(
        "Loaded %d rows, target positive rate: %.2f%%",
        len(df),
        df["target"].mean() * 100,
    )
    return df


def prepare_features(df: pd.DataFrame):
    """Create feature dicts and target array."""
    cols = [c for c in FEATURE_COLS if c in df.columns]
    X = df[cols].copy()
    for col in [
        "age", "gender", "race", "change",
        "diabetesMed", "A1Cresult", "max_glu_serum",
    ]:
        if col in X.columns:
            X[col] = X[col].astype(str)
    return X.to_dict(orient="records"), df["target"].values


def train_and_log(
    X_train,
    y_train,
    X_val,
    y_val,
    cfg: dict,
) -> str:
    """Train model, log to MLflow, save to models/model/."""
    logger.info("Training model ...")
    mlflow_cfg = cfg["mlflow"]
    model_cfg = cfg["model"]
    seed = cfg.get("seed", 42)

    tracking_uri = f"sqlite:///{_SCRIPT_DIR / mlflow_cfg['db']}"
    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(mlflow_cfg["experiment_name"])

    scale_pos_weight = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
    params = {
        "objective": model_cfg["objective"],
        "max_depth": model_cfg["max_depth"],
        "learning_rate": model_cfg["learning_rate"],
        "n_estimators": model_cfg["n_estimators"],
        "subsample": model_cfg["subsample"],
        "colsample_bytree": model_cfg["colsample_bytree"],
        "scale_pos_weight": scale_pos_weight,
        "random_state": seed,
        "eval_metric": model_cfg["eval_metric"],
    }

    pipeline = Pipeline([
        ("vectorizer", DictVectorizerWrapper()),
        ("classifier", xgb.XGBClassifier(**params)),
    ])

    with mlflow.start_run() as run:
        pipeline.fit(X_train, y_train)
        y_pred_proba = pipeline.predict_proba(X_val)[:, 1]
        pr_auc = average_precision_score(y_val, y_pred_proba)
        roc_auc = roc_auc_score(y_val, y_pred_proba)

        mlflow.log_params(params)
        mlflow.log_metric("pr_auc", pr_auc)
        mlflow.log_metric("roc_auc", roc_auc)
        mlflow.sklearn.log_model(pipeline, "model")

        run_id = run.info.run_id
        logger.info("PR-AUC: %.3f  ROC-AUC: %.3f", pr_auc, roc_auc)
        logger.info("MLflow Run ID: %s", run_id)

    deployment_path = _SCRIPT_DIR / "models" / "model"
    logger.info("Saving deployment-ready model to %s ...", deployment_path)
    if deployment_path.exists():
        shutil.rmtree(deployment_path)
    deployment_path.parent.mkdir(parents=True, exist_ok=True)
    mlflow.sklearn.save_model(pipeline, str(deployment_path))
    with open(_SCRIPT_DIR / "run_id.txt", "w") as f:
        f.write(run_id)
    logger.info("Model saved to %s", deployment_path)
    return run_id


def main() -> None:
    logger.info("=== Hospital Readmission Risk Training ===")
    cfg = load_config()
    seed = cfg.get("seed", 42)
    data_path = _SCRIPT_DIR.parent / cfg["data"]["path"]
    limit = cfg["data"].get("limit", 50_000)

    df = read_data(data_path, seed=seed, limit=limit)

    patient_target = df.groupby("patient_nbr")["target"].max()
    train_patients, val_patients = train_test_split(
        patient_target.index.tolist(),
        test_size=0.2,
        random_state=seed,
        stratify=patient_target.values,
    )
    df_train = df[df["patient_nbr"].isin(train_patients)]
    df_val = df[df["patient_nbr"].isin(val_patients)]
    X_train, y_train = prepare_features(df_train)
    X_val, y_val = prepare_features(df_val)

    train_and_log(X_train, y_train, X_val, y_val, cfg)
    logger.info("Training complete.")


if __name__ == "__main__":
    main()
