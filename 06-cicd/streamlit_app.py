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

# Configure the page natively for a clean, app-like feel
st.set_page_config(
    page_title="Readmission Dashboard",
    page_icon="🧊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─────────────────────────────────────────────
# MINIMAL MODERN CSS (Wix-inspired clean look)
# ─────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif !important;
}

/* Make the overall background a soft gray-white */
.stApp {
    background-color: #FAFAFA;
}

/* Style the top header title nicely */
.main-header {
    font-size: 2.2rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.2rem;
}
.sub-header {
    font-size: 1rem;
    color: #6B7280;
    margin-bottom: 2rem;
}

/* Beautiful form submit button */
.stFormSubmitButton button, button[kind="primary"] {
    background-color: #0F172A !important;
    color: white !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    padding: 0.6rem 2rem !important;
    border: none !important;
    transition: all 0.2s ease !important;
}
.stFormSubmitButton button:hover, button[kind="primary"]:hover {
    background-color: #334155 !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
    transform: translateY(-1px);
}

/* Custom metric styling for Dashboard */
div[data-testid="stMetricValue"] {
    font-size: 2.5rem;
    font-weight: 700;
    color: #0F172A;
}
div[data-testid="stMetricLabel"] {
    font-size: 0.95rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Clean up tabs */
.stTabs [data-baseweb="tab-list"] {
    gap: 2rem;
    border-bottom: 2px solid #E2E8F0;
}
.stTabs [data-baseweb="tab"] {
    padding-top: 1rem;
    padding-bottom: 1rem;
}
</style>
""", unsafe_allow_html=True)

DEFAULT_API = "http://localhost:9696" # Defaulting to local so we hit the NEW code
CLOUD_API = "https://hospital-readmission-risk-predictor-pcv7.onrender.com"
PREDICTION_LOG = Path(__file__).resolve().parent / "data" / "predictions.log"

# ─────────────────────────────────────────────
# Sidebar 
# ─────────────────────────────────────────────
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/2966/2966327.png", width=60)
    st.markdown("## MLOps Admin")
    st.caption("v2.0 Enterprise Dashboard")
    st.divider()
    
    st.markdown("**API Settings**")
    
    # Toggle between Local and Cloud
    api_choice = st.radio("Environment", ["Local (New API)", "Cloud (Old API)"], index=0)
    if "Local" in api_choice:
        api_url = st.text_input("API URL", value=DEFAULT_API)
    else:
        api_url = st.text_input("API URL", value=CLOUD_API)

    st.divider()
    api_status = "Unknown"
    api_version = "Unknown"
    
    if st.button("Check API Connection", use_container_width=True):
        try:
            r = requests.get(f"{api_url}/health", timeout=120)
            data = r.json()
            if data.get("model_loaded"):
                st.success("🟢 API Online & Model Loaded")
                api_status = "Online"
                api_version = data.get("run_id", "Not tracked")
            else:
                st.warning("🟡 API Online, Model Missing")
        except Exception as e:
            st.error(f"🔴 Connection Failed: {e}")
            
    if api_status == "Online":
        st.info(f"**Model Run ID:**\n`{api_version[:8]}`")


# ─────────────────────────────────────────────
# MAIN PAGE
# ─────────────────────────────────────────────
st.markdown('<div class="main-header">Hospital Readmission System</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">AI-Powered Risk Assessment & System Telemetry</div>', unsafe_allow_html=True)

tab1, tab2, tab3 = st.tabs(["👤 Patient Intake", "📂 Batch Processing", "📈 System Monitoring"])

# =====================================================================
# TAB 1: INDIVIDUAL PATIENT INTAKE
# =====================================================================
with tab1:
    with st.container(border=True):
        st.subheader("Patient Clinical Profile")
        st.caption("Enter patient details below to assess 30-day readmission risk.")
        
        with st.form("patient_form", border=False):
            st.markdown("##### 1. Demographics")
            r1c1, r1c2, r1c3 = st.columns(3)
            with r1c1: 
                age = st.selectbox("Age group", ["[0-10)", "[10-20)", "[20-30)", "[30-40)", "[40-50)", "[50-60)", "[60-70)", "[70-80)", "[80-90)", "[90-100)"], index=5)
                admission_type_id = st.number_input("Admission Type ID", min_value=1, max_value=8, value=1)
            with r1c2: 
                gender = st.selectbox("Gender", ["Female", "Male", "Unknown", "Unknown/Invalid"])
                discharge_disposition_id = st.number_input("Discharge ID", min_value=1, max_value=30, value=1)
            with r1c3: 
                race = st.selectbox("Race", ["Caucasian", "AfricanAmerican", "Asian", "Hispanic", "Other", "Unknown"])
                admission_source_id = st.number_input("Source ID", min_value=1, max_value=25, value=7)

            st.divider()
            st.markdown("##### 2. Hospital Visits & Procedures")
            r2c1, r2c2, r2c3, r2c4 = st.columns(4)
            with r2c1: 
                time_in_hospital = st.slider("Days in hospital", 1, 14, 3)
                number_emergency = st.number_input("Emergency visits", min_value=0, value=0)
            with r2c2: 
                num_lab_procedures = st.number_input("Lab procedures", min_value=0, value=41)
                number_inpatient = st.number_input("Inpatient visits", min_value=0, value=0)
            with r2c3: 
                num_procedures = st.number_input("Other procedures", min_value=0, value=0)
                number_outpatient = st.number_input("Outpatient visits", min_value=0, value=0)
            with r2c4:
                num_medications = st.number_input("Medications", min_value=0, value=8)
                number_diagnoses = st.number_input("Diagnoses", min_value=0, value=9)

            st.divider()
            st.markdown("##### 3. Lab Results & Diabetes")
            r3c1, r3c2, r3c3, r3c4 = st.columns(4)
            with r3c1: change = st.selectbox("Medication change", ["No", "Ch"], index=1)
            with r3c2: diabetesMed = st.selectbox("Diabetes medication", ["No", "Yes"], index=1)
            with r3c3: A1Cresult = st.selectbox("HbA1c result", ["not_tested", "None", "Norm", ">7", ">8"])
            with r3c4: max_glu_serum = st.selectbox("Max glucose", ["not_tested", "None", "Norm", ">200", ">300"])

            st.write("")
            submitted = st.form_submit_button("Assess Readmission Risk", use_container_width=True)

    if submitted:
        # Calculate derived features required by the OLD API (Render) 
        # so this UI works flawlessly with both the old and new backends
        care_intensity = number_emergency + number_inpatient + number_outpatient
        medication_changed = 1 if change == "Ch" else 0

        payload = {
            "time_in_hospital": time_in_hospital,
            "num_lab_procedures": num_lab_procedures,
            "num_procedures": num_procedures,
            "num_medications": num_medications,
            "number_emergency": number_emergency,
            "number_inpatient": number_inpatient,
            "number_outpatient": number_outpatient,
            "number_diagnoses": number_diagnoses,
            "care_intensity": care_intensity,
            "admission_type_id": admission_type_id,
            "discharge_disposition_id": discharge_disposition_id,
            "admission_source_id": admission_source_id,
            "age": age,
            "gender": gender,
            "race": race,
            "change": change,
            "diabetesMed": diabetesMed,
            "medication_changed": medication_changed,
            "A1Cresult": A1Cresult,
            "max_glu_serum": max_glu_serum,
        }
        
        with st.spinner("Analyzing patient data via ML API..."):
            try:
                r = requests.post(f"{api_url}/predict", json=payload, timeout=120)
                if r.status_code == 422:
                    st.error(f"API rejected the data format. Detail: {r.text}")
                else:
                    r.raise_for_status()
                    data = r.json()
                    score = data["risk_score"]
                    shap_values = data.get("shap_values")
                    base_value = data.get("base_value", 0.5)
                    
                    st.markdown("---")
                    st.subheader("Analysis Complete")
                    
                    import plotly.graph_objects as go
                    
                    # 1. Gauge Chart for Risk Score
                    fig_gauge = go.Figure(go.Indicator(
                        mode="gauge+number",
                        value=score * 100,
                        number={'suffix': "%", 'font': {'size': 50, 'color': '#0F172A'}},
                        title={'text': "30-Day Readmission Risk", 'font': {'size': 20, 'color': '#64748b'}},
                        gauge={
                            'axis': {'range': [0, 100], 'tickwidth': 1, 'tickcolor': "darkgray"},
                            'bar': {'color': "#0F172A"},
                            'bgcolor': "white",
                            'borderwidth': 2,
                            'bordercolor': "#e2e8f0",
                            'steps': [
                                {'range': [0, 30], 'color': "#dcfce7"},  # green-100
                                {'range': [30, 60], 'color': "#fef08a"},  # yellow-200
                                {'range': [60, 100], 'color': "#fee2e2"}   # red-200
                            ],
                            'threshold': {
                                'line': {'color': "red", 'width': 4},
                                'thickness': 0.75,
                                'value': 60
                            }
                        }
                    ))
                    fig_gauge.update_layout(height=350, margin=dict(l=20, r=20, t=50, b=20))
                    
                    # 2. SHAP Waterfall Chart
                    fig_shap = None
                    if shap_values:
                        # Sort by absolute impact for the top 8 features
                        sorted_shap = sorted(shap_values.items(), key=lambda x: abs(x[1]))[-8:]
                        # For a waterfall, we want them in order of application
                        features = [k for k, v in sorted_shap]
                        impacts = [v for k, v in sorted_shap]
                        
                        fig_shap = go.Figure(go.Waterfall(
                            x=impacts,
                            y=features,
                            orientation="h",
                            measure=["relative"] * len(features),
                            base=0,
                            decreasing={"marker": {"color": "#22c55e"}}, # green means less risk
                            increasing={"marker": {"color": "#ef4444"}}, # red means more risk
                            totals={"marker": {"color": "#3b82f6"}}
                        ))
                        fig_shap.update_layout(
                            title="<b>Explainable AI</b>: Key Clinical Drivers",
                            title_font=dict(size=18, color="#0F172A"),
                            showlegend=False,
                            height=350,
                            margin=dict(l=10, r=10, t=50, b=20),
                            xaxis_title="Impact on Risk Score (Log Odds)",
                            yaxis={'categoryorder':'total ascending'}
                        )

                    # Layout the charts
                    col_gauge, col_rec = st.columns([1, 1])
                    with col_gauge:
                        st.plotly_chart(fig_gauge, use_container_width=True)
                    with col_rec:
                        st.markdown("<br><br>", unsafe_allow_html=True)
                        if score > 0.6: 
                            st.error("🚨 **HIGH RISK**\n\nPatient is highly likely to return within 30 days. Recommend assigning a care coordinator and strict follow-up.")
                        elif score > 0.3: 
                            st.warning("⚠️ **MODERATE RISK**\n\nTargeted intervention and careful medication reconciliation recommended before discharge.")
                        else: 
                            st.success("✅ **LOW RISK**\n\nStandard discharge protocol is sufficient. Lower than average chance of readmission.")
                            
                    if fig_shap:
                        st.plotly_chart(fig_shap, use_container_width=True)
                        st.caption("SHAP (SHapley Additive exPlanations) values decompose the model's prediction. Red bars indicate factors increasing readmission risk; Green bars indicate protective factors.")
            except Exception as e:
                st.error(f"Failed to connect to backend: {e}")

# =====================================================================
# TAB 2: BATCH PROCESSING
# =====================================================================
with tab2:
    with st.container(border=True):
        st.subheader("Batch Risk Scoring")
        st.write("Upload a CSV file containing multiple patients (matching the feature schema) to score them simultaneously.")
        
        uploaded_file = st.file_uploader("Upload Patients CSV", type="csv")
        
        if uploaded_file is not None:
            try:
                df_batch = pd.read_csv(uploaded_file)
                st.write(f"Loaded **{len(df_batch)}** records.")
                st.dataframe(df_batch.head(5), use_container_width=True)
                
                if st.button("Score Entire Batch", type="primary"):
                    progress_bar = st.progress(0)
                    results = []
                    
                    for i, row in df_batch.iterrows():
                        payload = row.to_dict()
                        # Auto-compute for old APIs
                        payload["care_intensity"] = payload.get("number_emergency", 0) + payload.get("number_inpatient", 0) + payload.get("number_outpatient", 0)
                        payload["medication_changed"] = 1 if payload.get("change") == "Ch" else 0
                        
                        try:
                            resp = requests.post(f"{api_url}/predict", json=payload, timeout=120)
                            score = resp.json().get("risk_score", None)
                            results.append(score)
                        except:
                            results.append(None)
                        progress_bar.progress(int((i+1)/len(df_batch)*100))
                    
                    df_batch["predicted_risk_score"] = results
                    st.success("Batch scoring complete! You can download the annotated dataset below.")
                    
                    csv = df_batch.to_csv(index=False).encode('utf-8')
                    st.download_button(
                        label="Download Annotated CSV",
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
    with st.container(border=True):
        header_col, btn_col = st.columns([4, 1])
        with header_col:
            st.subheader("System Telemetry")
            st.caption("Live monitoring of the model's data exhaust (`predictions.log`).")
        with btn_col:
            st.button("🔄 Refresh Data", use_container_width=True)

        if PREDICTION_LOG.exists():
            df_logs = pd.read_csv(PREDICTION_LOG)
            df_logs['ts'] = pd.to_datetime(df_logs['ts'])
            
            total_preds = len(df_logs)
            avg_risk = df_logs['risk_score'].mean()
            high_risk_pct = (df_logs['risk_score'] > 0.6).mean() * 100

            st.markdown("---")
            c1, c2, c3 = st.columns(3)
            with c1: st.metric("Total Predictions Handled", f"{total_preds}")
            with c2: st.metric("Overall Readmission Probability", f"{avg_risk:.1%}")
            with c3: st.metric("High-Risk Patient Ratio", f"{high_risk_pct:.1f}%")
            
            st.markdown("---")
            st.markdown("**Risk Score Distribution**")
            st.caption("A shift in this distribution may indicate concept drift in the patient population.")
            st.bar_chart(df_logs['risk_score'].value_counts(bins=20).sort_index())

            st.markdown("**Raw Pipeline Logs**")
            st.dataframe(df_logs.sort_values("ts", ascending=False), use_container_width=True)
        else:
            st.info("No prediction logs found yet. The `predictions.log` file is generated locally when the API serves predictions. Try scoring a patient in the Intake tab while connected to Localhost!")
