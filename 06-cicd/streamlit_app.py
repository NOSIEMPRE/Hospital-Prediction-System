"""Streamlit UI for Hospital Readmission Risk Prediction.
Includes Patient Intake, Batch Scoring, and System Monitoring dashboards.
Run: streamlit run streamlit_app.py
Requires the API server running (python app.py or Docker on port 9696).
"""
import io
import os
import time
from pathlib import Path

import pandas as pd
import requests
import streamlit as st
import plotly.graph_objects as go

st.set_page_config(
    page_title="Readmission Dashboard",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─────────────────────────────────────────────
# PREMIUM CLINICAL NAVY CSS (Matched to design)
# ─────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    color: #e2e8f0;
}

/* Deep Warm Navy Background */
.stApp {
    background-color: #0b1121;
}

/* Sidebar Styling */
[data-testid="stSidebar"] {
    background-color: #0f1627 !important;
    border-right: 1px solid #1e293b !important;
}

/* Hide native top padding */
.block-container {
    padding-top: 2rem !important;
}

/* Hide up/down stepper arrows on number inputs to look modern */
[data-testid="stNumberInputStepUp"], [data-testid="stNumberInputStepDown"] {
    display: none !important;
}

/* Inputs styling - matching the screenshot */
.stSelectbox > div > div, .stTextInput > div > div, .stNumberInput > div > div {
    background-color: #1a243a !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    color: #f8fafc !important;
    border-radius: 6px !important;
    font-size: 0.95rem !important;
    padding-left: 0.5rem !important;
    box-shadow: none !important;
}

/* Number input inner field */
.stNumberInput input {
    background-color: #1a243a !important;
    color: #f8fafc !important;
    border: none !important;
    box-shadow: none !important;
}

/* Slider input */
.stSlider input {
    background-color: #1a243a !important;
}

/* Uppercase minimal labels */
label {
    text-transform: uppercase !important;
    font-size: 0.70rem !important;
    letter-spacing: 0.06em !important;
    color: #64748b !important;
    font-weight: 600 !important;
    margin-bottom: -0.2rem !important;
}

/* Custom Section Headers */
.section-header {
    display: flex; 
    align-items: center; 
    border-bottom: 1px solid #1e293b; 
    padding-bottom: 0.6rem; 
    margin-top: 1.5rem; 
    margin-bottom: 1rem;
}
.circle-num {
    background: rgba(13, 148, 136, 0.1); 
    color: #14b8a6; 
    border: 1px solid rgba(20, 184, 166, 0.3); 
    border-radius: 50%; 
    min-width: 24px; 
    height: 24px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-size: 0.75rem; 
    font-weight: 700; 
    margin-right: 0.8rem;
}
.section-title { font-size: 1.05rem; font-weight: 600; color: #f8fafc; flex-grow: 1; margin: 0; }
.section-desc { font-size: 0.75rem; color: #64748b; font-weight: 400; margin: 0; text-align: right;}

/* Header Dashboard Bar */
.top-bar-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
}
.top-title { font-size: 1.5rem; font-weight: 600; margin: 0; color: #f8fafc; letter-spacing: -0.02em;}
.top-subtitle { font-size: 0.85rem; color: #64748b; margin: 0; margin-top:0.2rem;}
.status-pill {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #10b981;
    padding: 0.4rem 1rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.4rem;
}
.status-pill::before {
    content: '';
    width: 6px; height: 6px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 8px #10b981;
}
.status-pill-offline {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
}
.status-pill-offline::before { background: #ef4444; box-shadow: 0 0 8px #ef4444; }

/* Primary Buttons */
.stFormSubmitButton button, button[kind="primary"] {
    background: rgba(13, 148, 136, 0.1) !important;
    color: #14b8a6 !important;
    border: 1px solid rgba(20, 184, 166, 0.5) !important;
    border-radius: 6px !important;
    font-weight: 600 !important;
    padding: 0.5rem 2.5rem !important;
    transition: all 0.2s ease !important;
}
.stFormSubmitButton button:hover, button[kind="primary"]:hover {
    background: #14b8a6 !important;
    color: #0b1121 !important;
}

/* Custom Risk Bar */
.risk-bar-container {
    background: #1a243a;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
}
.risk-track {
    flex-grow: 1;
    height: 6px;
    background: #0f1627;
    border-radius: 3px;
    position: relative;
    overflow: hidden;
}
.risk-fill {
    position: absolute; left: 0; top: 0; height: 100%;
    background: linear-gradient(90deg, #14b8a6, #eab308, #ef4444);
    border-radius: 3px;
    transition: width 0.5s ease-in-out;
}
.risk-labels {
    display: flex; justify-content: space-between;
    font-size: 0.65rem; color: #64748b; font-weight: 600;
    margin-top: 0.5rem; text-transform: uppercase;
}
.risk-label-main { font-size: 0.85rem; color: #94a3b8; width: 150px; }
.risk-status-button {
    background: #0f1627;
    color: #14b8a6;
    border: 1px solid #1e293b;
    padding: 0.4rem 1.2rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
}
</style>
""", unsafe_allow_html=True)

DEFAULT_API = os.environ.get("ML_API_URL", "https://hospital-prediction-system.onrender.com")
CLOUD_API = "https://hospital-readmission-risk-predictor-pcv7.onrender.com"
PREDICTION_LOG = Path(__file__).resolve().parent / "data" / "predictions.log"

# ─────────────────────────────────────────────
# STATE INIT
# ─────────────────────────────────────────────
if "api_url" not in st.session_state:
    st.session_state.api_url = DEFAULT_API
if "api_online" not in st.session_state:
    st.session_state.api_online = False
if "api_version" not in st.session_state:
    st.session_state.api_version = "Checking..."
if "last_score" not in st.session_state:
    st.session_state.last_score = None
if "last_shap" not in st.session_state:
    st.session_state.last_shap = None

# Check API health automatically
try:
    r = requests.get(f"{st.session_state.api_url}/health", timeout=2)
    data = r.json()
    st.session_state.api_online = data.get("model_loaded", False)
    st.session_state.api_version = data.get("run_id", "Unknown")[:8]
except:
    st.session_state.api_online = False

def render_top_bar():
    pill_class = "status-pill" if st.session_state.api_online else "status-pill status-pill-offline"
    pill_text = f"Model online - [{st.session_state.api_version}]" if st.session_state.api_online else "Model offline - Action required"
    st.markdown(f"""
    <div class="top-bar-container">
        <div>
            <h1 class="top-title">Hospital Readmission System</h1>
            <p class="top-subtitle">AI-Powered Risk Assessment & System Telemetry</p>
        </div>
        <div class="{pill_class}">{pill_text}</div>
    </div>
    """, unsafe_allow_html=True)

# ─────────────────────────────────────────────
# PAGE 1: PATIENT INTAKE
# ─────────────────────────────────────────────
def page_intake():
    render_top_bar()
    
    # Custom Risk Bar visualization (from the screenshot)
    score_pct = (st.session_state.last_score * 100) if st.session_state.last_score else 0
    status_text = "Awaiting input"
    status_color = "#64748b"
    if st.session_state.last_score is not None:
        if st.session_state.last_score > 0.6:
            status_text = "High Risk"
            status_color = "#ef4444"
        elif st.session_state.last_score > 0.3:
            status_text = "Moderate"
            status_color = "#eab308"
        else:
            status_text = "Low Risk"
            status_color = "#14b8a6"
            
    st.markdown(f"""
    <div class="risk-bar-container">
        <div class="risk-label-main">Readmission risk score</div>
        <div style="flex-grow: 1;">
            <div class="risk-track">
                <div class="risk-fill" style="width: {score_pct}%;"></div>
            </div>
            <div class="risk-labels"><span>Low</span><span>Moderate</span><span>High</span></div>
        </div>
        {"" if st.session_state.last_score is None else f'<div class="risk-status-button" style="color: {status_color}; border-color: {status_color}40;">{status_text}</div>'}
    </div>
    """, unsafe_allow_html=True)

    with st.form("patient_form", border=False):
        # SECTION 1
        st.markdown("""
        <div class="section-header">
            <div class="circle-num">1</div><p class="section-title">Demographics</p><p class="section-desc">Patient classification</p>
        </div>
        """, unsafe_allow_html=True)
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

        # SECTION 2
        st.markdown("""
        <div class="section-header">
            <div class="circle-num">2</div><p class="section-title">Hospital Visits & Procedures</p><p class="section-desc">Utilisation data</p>
        </div>
        """, unsafe_allow_html=True)
        time_in_hospital = st.slider("Days in hospital", 1, 14, 3)

        r2c1, r2c2, r2c3, r2c4 = st.columns(4)
        with r2c1: num_lab_procedures = st.number_input("Lab procedures", min_value=0, value=41)
        with r2c2: num_procedures = st.number_input("Other procedures", min_value=0, value=0)
        with r2c3: num_medications = st.number_input("Medications", min_value=0, value=8)
        with r2c4: number_diagnoses = st.number_input("Diagnoses", min_value=0, value=9)

        r2b1, r2b2, r2b3 = st.columns(3)
        with r2b1: number_emergency = st.number_input("Emergency visits", min_value=0, value=0)
        with r2b2: number_inpatient = st.number_input("Inpatient visits", min_value=0, value=0)
        with r2b3: number_outpatient = st.number_input("Outpatient visits", min_value=0, value=0)

        # SECTION 3
        st.markdown("""
        <div class="section-header">
            <div class="circle-num">3</div><p class="section-title">Lab Results & Diabetes</p><p class="section-desc">Clinical indicators</p>
        </div>
        """, unsafe_allow_html=True)
        r3c1, r3c2, r3c3, r3c4 = st.columns(4)
        with r3c1: change = st.selectbox("Medication change", ["No", "Ch"], index=1)
        with r3c2: diabetesMed = st.selectbox("Diabetes medication", ["No", "Yes"], index=1)
        with r3c3: A1Cresult = st.selectbox("HbA1c result", ["not_tested", "None", "Norm", ">7", ">8"])
        with r3c4: max_glu_serum = st.selectbox("Max glucose", ["not_tested", "None", "Norm", ">200", ">300"])

        st.write("")
        c1, c2, c3 = st.columns([1,1,2])
        with c1: submitted = st.form_submit_button("Assess Risk", use_container_width=True)

    if submitted:
        payload = {
            "time_in_hospital": time_in_hospital, "num_lab_procedures": num_lab_procedures,
            "num_procedures": num_procedures, "num_medications": num_medications,
            "number_emergency": number_emergency, "number_inpatient": number_inpatient,
            "number_outpatient": number_outpatient, "number_diagnoses": number_diagnoses,
            "care_intensity": number_emergency + number_inpatient + number_outpatient,
            "admission_type_id": admission_type_id, "discharge_disposition_id": discharge_disposition_id,
            "admission_source_id": admission_source_id, "age": age, "gender": gender,
            "race": race, "change": change, "diabetesMed": diabetesMed,
            "medication_changed": 1 if change == "Ch" else 0,
            "A1Cresult": A1Cresult, "max_glu_serum": max_glu_serum,
        }
        
        with st.spinner("Analyzing patient clinical profile..."):
            try:
                r = requests.post(f"{st.session_state.api_url}/predict", json=payload, timeout=120)
                r.raise_for_status()
                data = r.json()
                st.session_state.last_score = data["risk_score"]
                st.session_state.last_shap = data.get("shap_values")
                st.rerun()  # Rerun to update the Risk Bar at the very top!
            except Exception as e:
                st.error(f"Failed to connect to backend API: {e}")

    # Render SHAP waterfall if we have it in session state
    if st.session_state.last_shap:
        st.markdown("---")
        sorted_shap = sorted(st.session_state.last_shap.items(), key=lambda x: abs(x[1]))[-8:]
        features = [k for k, v in sorted_shap]
        impacts = [v for k, v in sorted_shap]
        
        fig_shap = go.Figure(go.Waterfall(
            x=impacts,
            y=features,
            orientation="h",
            measure=["relative"] * len(features),
            base=0,
            decreasing={"marker": {"color": "#14b8a6"}}, # teal
            increasing={"marker": {"color": "#ef4444"}}, # red
            totals={"marker": {"color": "#64748b"}}
        ))
        fig_shap.update_layout(
            template='plotly_dark',
            title="<b>Explainable AI</b>: Key Clinical Drivers",
            title_font=dict(size=14, color="#f8fafc", family="Plus Jakarta Sans"),
            showlegend=False,
            height=300,
            margin=dict(l=10, r=10, t=40, b=20),
            xaxis_title="Impact on Risk Score (Log Odds)",
            yaxis={'categoryorder':'total ascending'},
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font=dict(color="#94a3b8", family="Plus Jakarta Sans")
        )
        st.plotly_chart(fig_shap, use_container_width=True)


# ─────────────────────────────────────────────
# PAGE 2: BATCH PROCESSING
# ─────────────────────────────────────────────
def page_batch():
    render_top_bar()
    st.markdown("""
    <div class="section-header">
        <div class="circle-num">📁</div><p class="section-title">Batch Risk Scoring</p><p class="section-desc">Upload clinical datasets</p>
    </div>
    """, unsafe_allow_html=True)
    
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
                    payload["care_intensity"] = payload.get("number_emergency", 0) + payload.get("number_inpatient", 0) + payload.get("number_outpatient", 0)
                    payload["medication_changed"] = 1 if payload.get("change") == "Ch" else 0
                    try:
                        resp = requests.post(f"{st.session_state.api_url}/predict", json=payload, timeout=120)
                        results.append(resp.json().get("risk_score", None))
                    except:
                        results.append(None)
                    progress_bar.progress(int((i+1)/len(df_batch)*100))
                
                df_batch["predicted_risk_score"] = results
                st.success("Batch scoring complete!")
                st.download_button("Download Annotated CSV", data=df_batch.to_csv(index=False).encode('utf-8'), file_name="scored_patients.csv", mime="text/csv")
        except Exception as e:
            st.error(f"Error reading CSV: {e}")

# ─────────────────────────────────────────────
# PAGE 3: SYSTEM MONITORING
# ─────────────────────────────────────────────
def page_monitor():
    render_top_bar()
    st.markdown("""
    <div class="section-header">
        <div class="circle-num">📈</div><p class="section-title">System Telemetry</p><p class="section-desc">Live production metrics</p>
    </div>
    """, unsafe_allow_html=True)
    if st.button("🔄 Refresh Telemetry"): pass

    if PREDICTION_LOG.exists():
        df_logs = pd.read_csv(PREDICTION_LOG)
        if len(df_logs) > 0:
            df_logs['ts'] = pd.to_datetime(df_logs['ts'])
            c1, c2, c3 = st.columns(3)
            with c1: st.metric("Total Predictions", f"{len(df_logs)}")
            with c2: st.metric("Average Probability", f"{df_logs['risk_score'].mean():.1%}")
            with c3: st.metric("High-Risk Ratio", f"{(df_logs['risk_score'] > 0.6).mean() * 100:.1f}%")
            
            st.markdown("---")
            fig_hist = go.Figure(go.Histogram(
                x=df_logs['risk_score'],
                nbinsx=20,
                marker_color='#14b8a6',
                marker_line_color='#0b1121',
                marker_line_width=1,
            ))
            fig_hist.update_layout(
                template='plotly_dark',
                title="<b>Risk Score Distribution</b>",
                title_font=dict(size=14, color="#f8fafc", family="Plus Jakarta Sans"),
                xaxis_title="Risk Score",
                yaxis_title="Number of Predictions",
                xaxis=dict(range=[0, 1], tickformat=".0%"),
                height=300,
                margin=dict(l=10, r=10, t=40, b=20),
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(color="#94a3b8", family="Plus Jakarta Sans"),
            )
            st.plotly_chart(fig_hist, use_container_width=True)
            st.markdown("**Raw Pipeline Logs**")
            df_display = df_logs.sort_values("ts", ascending=False).copy()
            df_display["model_version"] = df_display["model_version"].str[:8]
            st.dataframe(df_display, use_container_width=True)
        else:
            st.info("Log is empty. Make a prediction in Patient Intake first.")
    else:
        st.info("No prediction logs found.")

# ─────────────────────────────────────────────
# NAVIGATION SETUP (Requires Streamlit 1.37+)
# ─────────────────────────────────────────────
pages = {
    "CLINICAL": [
        st.Page(page_intake, title="Patient Intake", icon=":material/person_add:"),
        st.Page(page_batch, title="Batch Processing", icon=":material/folder_open:"),
        st.Page(page_monitor, title="System Monitoring", icon=":material/monitoring:")
    ]
}
pg = st.navigation(pages)

with st.sidebar:
    st.markdown("---")
    st.markdown("<label style='font-size:0.65rem;'>API SETTINGS</label>", unsafe_allow_html=True)
    api_choice = st.radio("Environment", ["Local API", "Cloud API"], index=0, label_visibility="collapsed")
    new_api = DEFAULT_API if "Local" in api_choice else CLOUD_API
    if new_api != st.session_state.api_url:
        st.session_state.api_url = new_api
        st.rerun()

pg.run()
