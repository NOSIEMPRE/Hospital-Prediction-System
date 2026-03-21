"""Streamlit UI for Hospital Readmission Risk Prediction.
Includes Patient Intake, Batch Scoring, and System Monitoring dashboards.
Run: streamlit run streamlit_app.py
Requires the API server running (python app.py or Docker on port 9696).
"""
import io
import time
from pathlib import Path

import pandas as pd
import requests
import streamlit as st

st.set_page_config(
    page_title="Readmission Risk — MLOps Dashboard",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────────
# GLOBAL STYLES
# ─────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* ── Reset & Base ── */
html, body, [class*="css"] { font-family: 'Inter', sans-serif; font-size: 16px; }
.main { background-color: #f0f4f8; }
.main .block-container { padding: 0 0 2rem 0; max-width: 100%; }

/* ── Sidebar ── */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0f2044 0%, #1a3a6e 100%);
    border-right: none;
}
[data-testid="stSidebar"], [data-testid="stSidebar"] *, [data-testid="stSidebar"] p,
[data-testid="stSidebar"] span, [data-testid="stSidebar"] label,
[data-testid="stSidebar"] div, [data-testid="stSidebar"] .stMarkdown,
[data-testid="stSidebar"] .stMarkdown p { color: #e2e8f0 !important; }
[data-testid="stSidebar"] h1, [data-testid="stSidebar"] h2,
[data-testid="stSidebar"] h3, [data-testid="stSidebar"] strong,
[data-testid="stSidebar"] b { color: #ffffff !important; }

/* ── Page header banner ── */
.page-header {
    background: linear-gradient(135deg, #0f2044 0%, #1e3a5f 55%, #1a4e8a 100%);
    padding: 1.25rem 2rem 1.1rem;
    margin-bottom: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
}
.page-header-icon { font-size: 2rem; line-height: 1; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3)); }
.page-header-text h1 {
    font-size: 1.5rem !important; font-weight: 700 !important;
    color: #ffffff !important; margin: 0 0 0.15rem 0 !important; letter-spacing: -0.01em;
}
.page-header-text p { font-size: 0.95rem !important; color: #93c5fd !important; margin: 0 !important; }

/* ── Form inputs ── */
.stSelectbox label, .stNumberInput label, .stSlider label {
    font-size: 0.95rem !important; font-weight: 500 !important; color: #475569 !important;
}

/* ── Buttons ── */
.stFormSubmitButton button, button[kind="primary"] {
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%) !important;
    color: #ffffff !important; border: none !important; font-weight: 600 !important;
    font-size: 0.95rem !important; border-radius: 8px !important; padding: 0.65rem 2.5rem !important;
    box-shadow: 0 2px 8px rgba(37,99,235,0.35) !important; transition: all 0.2s !important;
}

/* ── Metric cards ── */
[data-testid="stMetricValue"] { font-size: 2rem !important; font-weight: 700 !important; color: #1e293b !important; }
[data-testid="stMetricLabel"] { font-size: 0.9rem !important; font-weight: 600 !important; color: #64748b !important; text-transform: uppercase; }

/* ── Content wrapper ── */
.content-wrap { padding: 1.1rem 1.75rem; }
.row-section-label {
    font-size: 0.85rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    color: #64748b; margin: 0.9rem 0 0.6rem; display: flex; align-items: center; gap: 0.5rem;
}
.row-section-label::before { content: ''; width: 3px; height: 14px; background: #2563eb; border-radius: 2px; }
.styled-divider { border: none; border-top: 1px solid #e2e8f0; margin: 0.75rem 0; }
</style>
""", unsafe_allow_html=True)

DEFAULT_API = "https://hospital-prediction-system.onrender.com"
PREDICTION_LOG = Path(__file__).resolve().parent / "data" / "predictions.log"

# ─────────────────────────────────────────────
# Sidebar — API Config & Health
# ─────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style="padding: 0.9rem 0 0.4rem; text-align:center;">
        <div style="font-size:2rem;">🏥</div>
        <div style="font-size:1rem; font-weight:700; color:#e2e8f0; margin-top:0.25rem;">MLOps Dashboard</div>
        <div style="font-size:0.8rem; color:#64748b; margin-top:0.1rem; letter-spacing:0.04em;">ADMINISTRATION</div>
    </div>
    <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:0.75rem 0;">
    """, unsafe_allow_html=True)

    st.markdown('<p style="font-size:0.82rem; font-weight:600; color:#64748b; margin-bottom:0.5rem;">API ENDPOINT</p>', unsafe_allow_html=True)
    api_url = st.text_input(
        "API Base URL",
        value=DEFAULT_API,
        label_visibility="collapsed",
        placeholder="http://localhost:9696",
    ).rstrip("/")

    api_status = ""
    api_version = ""
    
    if st.button("⚡  Check API Health", use_container_width=True):
        try:
            r = requests.get(f"{api_url}/health", timeout=10)
            data = r.json()
            if data.get("model_loaded"):
                st.success("✓  System Online")
                api_status = "Online"
                api_version = data.get("run_id", "Multiple/Cloud")
            else:
                st.warning("⚠  API connected but model disconnected")
                api_status = "Degraded"
        except Exception as e:
            st.error(f"✗  Connection Failed: {e}")
            api_status = "Offline"
            
    if api_status == "Online":
        st.markdown(f"""
        <div style="margin-top:20px; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px;">
            <div style="font-size:0.8rem; color:#94a3b8;">DEPLOYED MODEL ID:</div>
            <div style="font-family:monospace; color:#4ade80;">{api_version[:8] if api_version else '---'}</div>
        </div>
        """, unsafe_allow_html=True)


st.markdown("""
<div class="page-header">
    <div class="page-header-icon">🏥</div>
    <div class="page-header-text">
        <h1>Readmission Risk — MLOps Dashboard</h1>
        <p>Enterprise Prediction & Monitoring System</p>
    </div>
</div>
""", unsafe_allow_html=True)


# ─────────────────────────────────────────────
# TABS
# ─────────────────────────────────────────────
st.markdown('<div class="content-wrap">', unsafe_allow_html=True)
tab1, tab2, tab3 = st.tabs(["👤 Patient Intake", "📂 Batch Processing", "📈 System Monitoring"])

# =====================================================================
# TAB 1: INDIVIDUAL PATIENT INTAKE
# =====================================================================
with tab1:
    st.markdown("###  Individual Patient Scoring")
    with st.form("patient_form"):
        st.markdown('<div class="row-section-label">Demographics</div>', unsafe_allow_html=True)
        r1c1, r1c2, r1c3, r1c4, r1c5, r1c6 = st.columns(6, gap="medium")
        with r1c1: age = st.selectbox("Age group", ["[0-10)", "[10-20)", "[20-30)", "[30-40)", "[40-50)", "[50-60)", "[60-70)", "[70-80)", "[80-90)", "[90-100)"], index=5)
        with r1c2: gender = st.selectbox("Gender", ["Female", "Male", "Unknown", "Unknown/Invalid"])
        with r1c3: race = st.selectbox("Race", ["Caucasian", "AfricanAmerican", "Asian", "Hispanic", "Other", "Unknown"])
        with r1c4: admission_type_id = st.number_input("Admin type ID", min_value=1, max_value=8, value=1)
        with r1c5: discharge_disposition_id = st.number_input("Discharge ID", min_value=1, max_value=30, value=1)
        with r1c6: admission_source_id = st.number_input("Source ID", min_value=1, max_value=25, value=7)

        st.markdown('<hr class="styled-divider">', unsafe_allow_html=True)
        st.markdown('<div class="row-section-label">Clinical Data</div>', unsafe_allow_html=True)
        r2c1, r2c2, r2c3, r2c4, r2c5, r2c6, r2c7, r2c8 = st.columns([3, 2, 2, 2, 2, 2, 2, 2], gap="medium")
        with r2c1: time_in_hospital = st.slider("Days in hospital", 1, 14, 3)
        with r2c2: num_lab_procedures = st.number_input("Lab proc.", min_value=0, value=41)
        with r2c3: num_procedures = st.number_input("Procedures", min_value=0, value=0)
        with r2c4: num_medications = st.number_input("Meds", min_value=0, value=8)
        with r2c5: number_diagnoses = st.number_input("Diagnoses", min_value=0, value=9)
        with r2c6: number_emergency = st.number_input("Emerg. visits", min_value=0, value=0)
        with r2c7: number_inpatient = st.number_input("Inpat. visits", min_value=0, value=0)
        with r2c8: number_outpatient = st.number_input("Outpat. visits", min_value=0, value=0)

        st.markdown('<hr class="styled-divider">', unsafe_allow_html=True)
        st.markdown('<div class="row-section-label">Medication & Lab Results</div>', unsafe_allow_html=True)
        r3c1, r3c2, r3c3, r3c4 = st.columns(4, gap="medium")
        with r3c1: change = st.selectbox("Medication change", ["No", "Ch"], index=1)
        with r3c2: diabetesMed = st.selectbox("Diabetes medication", ["No", "Yes"], index=1)
        with r3c3: A1Cresult = st.selectbox("HbA1c result", ["not_tested", "None", "Norm", ">7", ">8"])
        with r3c4: max_glu_serum = st.selectbox("Max glucose", ["not_tested", "None", "Norm", ">200", ">300"])

        submitted = st.form_submit_button("🔍  Predict Risk", use_container_width=False)

    if submitted:
        payload = {
            "time_in_hospital": time_in_hospital,
            "num_lab_procedures": num_lab_procedures,
            "num_procedures": num_procedures,
            "num_medications": num_medications,
            "number_emergency": number_emergency,
            "number_inpatient": number_inpatient,
            "number_outpatient": number_outpatient,
            "number_diagnoses": number_diagnoses,
            "admission_type_id": admission_type_id,
            "discharge_disposition_id": discharge_disposition_id,
            "admission_source_id": admission_source_id,
            "age": age,
            "gender": gender,
            "race": race,
            "change": change,
            "diabetesMed": diabetesMed,
            "A1Cresult": A1Cresult,
            "max_glu_serum": max_glu_serum,
        }
        with st.spinner("Processing..."):
            try:
                r = requests.post(f"{api_url}/predict", json=payload, timeout=60)
                r.raise_for_status()
                data = r.json()
                score = data["risk_score"]
                st.success(f"### Predicted Risk: {score*100:.1f}%")
                if score > 0.6: st.error("**HIGH RISK** — Assign care coordinator.")
                elif score > 0.3: st.warning("**MODERATE RISK** — Targeted intervention recommended.")
                else: st.info("**LOW RISK** — Standard discharge protocol.")
            except Exception as e:
                st.error(f"API Error: {e}")

# =====================================================================
# TAB 2: BATCH PROCESSING
# =====================================================================
with tab2:
    st.markdown("###  Batch Risk Scoring")
    st.write("Upload a CSV file of multiple patients to score them simultaneously via the API.")
    
    uploaded_file = st.file_uploader("Upload Patients CSV", type="csv")
    
    if uploaded_file is not None:
        try:
            df_batch = pd.read_csv(uploaded_file)
            st.write(f"Loaded **{len(df_batch)}** patients.")
            st.dataframe(df_batch.head(5))
            
            if st.button("Score Batch", type="primary"):
                progress_bar = st.progress(0)
                results = []
                # Simple synchronous batching (for demo purposes)
                for i, row in df_batch.iterrows():
                    # We pass the minimal required fields
                    payload = row.to_dict()
                    try:
                        resp = requests.post(f"{api_url}/predict", json=payload, timeout=5)
                        score = resp.json().get("risk_score", None)
                        results.append(score)
                    except:
                        results.append(None)
                    progress_bar.progress(int((i+1)/len(df_batch)*100))
                
                df_batch["predicted_risk_score"] = results
                st.success("Batch scoring complete!")
                
                csv = df_batch.to_csv(index=False).encode('utf-8')
                st.download_button(
                    label="Download Results as CSV",
                    data=csv,
                    file_name="scored_patients.csv",
                    mime="text/csv",
                )
        except Exception as e:
            st.error(f"Error reading CSV: {e}")

# =====================================================================
# TAB 3: SYSTEM MONITORING
# =====================================================================
with tab3:
    st.markdown("###  Production Monitoring Dashboard")
    st.write("Live telemetry from the `predictions.log` file generated by the FastAPI backend.")
    if st.button("🔄 Refresh Data"):
        pass

    if PREDICTION_LOG.exists():
        df_logs = pd.read_csv(PREDICTION_LOG)
        df_logs['ts'] = pd.to_datetime(df_logs['ts'])
        total_preds = len(df_logs)
        avg_risk = df_logs['risk_score'].mean()
        high_risk_pct = (df_logs['risk_score'] > 0.6).mean() * 100

        col1, col2, col3 = st.columns(3)
        col1.metric("Total Predictions", f"{total_preds}")
        col2.metric("Average Risk Score", f"{avg_risk:.2%}")
        col3.metric("High Risk Share (>60%)", f"{high_risk_pct:.1f}%")

        st.markdown("#### Risk Score Distribution (Drift Detection)")
        st.bar_chart(df_logs['risk_score'].value_counts(bins=10).sort_index())

        st.markdown("#### Recent Prediction Logs")
        st.dataframe(df_logs.tail(10).sort_values("ts", ascending=False))
    else:
        st.info("No prediction telemetry found. Issue predictions in Tab 1 to generate logs locally, or ensure Render API is logging to a persistent volume.")

st.markdown('</div>', unsafe_allow_html=True)
