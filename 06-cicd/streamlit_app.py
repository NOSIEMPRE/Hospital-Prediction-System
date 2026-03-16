"""Streamlit UI for live testing the Hospital Readmission Risk /predict endpoint.

Run: streamlit run streamlit_app.py
Requires the API server running (python app.py or Docker on port 9696).
"""

import requests
import streamlit as st

st.set_page_config(
    page_title="Hospital Readmission Risk — Live Test",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS: light theme, larger fonts, better contrast
st.markdown("""
<style>
    /* Force light background for main content (readable in dark mode) */
    .main, .main .block-container {
        background-color: #ffffff !important;
        color: #1e293b !important;
    }
    .main .block-container { padding-top: 2rem; padding-bottom: 2rem; max-width: 1200px; }

    /* Base font size - larger */
    .main p, .main span, .main label, .main .stMarkdown {
        font-size: 1.05rem !important;
        color: #1e293b !important;
    }

    /* Header - larger, high contrast */
    h1 {
        font-size: 2.2rem !important;
        font-weight: 600 !important;
        color: #0f172a !important;
        margin-bottom: 0.25rem !important;
    }
    h2, h3 {
        font-size: 1.5rem !important;
        color: #1e293b !important;
    }

    /* Form labels - visible, larger */
    .stForm label, [data-testid="stWidgetLabel"] {
        font-size: 1.05rem !important;
        color: #334155 !important;
        font-weight: 500 !important;
    }

    /* Input fields - light bg, dark text */
    .stForm input, .stForm select, .stSelectbox div, .stNumberInput input {
        background-color: #ffffff !important;
        color: #1e293b !important;
        font-size: 1rem !important;
    }

    /* Section cards - light background */
    .stForm {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    /* Result card */
    .result-card {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #ffffff !important;
        padding: 1.75rem;
        border-radius: 12px;
        margin: 1rem 0;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
    }
    .result-card .risk-value { font-size: 2.8rem !important; font-weight: 700; }
    .result-card .risk-label { opacity: 0.95; font-size: 1.1rem !important; }

    /* Sidebar - light bg, dark text */
    [data-testid="stSidebar"] {
        background-color: #f8fafc !important;
    }
    [data-testid="stSidebar"] .stMarkdown, [data-testid="stSidebar"] p, [data-testid="stSidebar"] label {
        color: #334155 !important;
        font-size: 1.05rem !important;
    }
    [data-testid="stSidebar"] input {
        background-color: #ffffff !important;
        color: #1e293b !important;
    }

    /* Caption - larger */
    .stCaption { font-size: 1rem !important; color: #475569 !important; }

    /* Subtitle - larger, readable */
    .main h1 + p, .main h1 + .element-container p { font-size: 1.2rem !important; color: #475569 !important; }

    /* Override dark theme inputs - force light */
    div[data-testid="stSelectbox"] input, div[data-testid="stNumberInput"] input,
    .stSelectbox > div, .stNumberInput > div {
        background-color: #ffffff !important;
        color: #1e293b !important;
    }

    /* Slider labels */
    .stSlider label { font-size: 1.05rem !important; color: #334155 !important; }
</style>
""", unsafe_allow_html=True)

# Default: local API; override via sidebar for deployed URL
DEFAULT_API = "http://localhost:9696"

# Sidebar
with st.sidebar:
    st.markdown("### ⚙️ API Configuration")
    api_url = st.text_input(
        "API Base URL",
        value=DEFAULT_API,
        help="Local: http://localhost:9696 | Deployed: https://xxx.onrender.com",
        label_visibility="collapsed",
    ).rstrip("/")
    st.markdown(
        '<p style="font-size: 1rem; color: #475569;">Enter API URL and click below to check connection</p>',
        unsafe_allow_html=True,
    )

    with st.expander("🔍 Check API Status", expanded=False):
        if st.button("Check Health", use_container_width=True):
            try:
                r = requests.get(f"{api_url}/health", timeout=5)
                data = r.json()
                if data.get("model_loaded"):
                    st.success("✅ Model loaded")
                else:
                    st.warning("⚠️ Model not loaded")
                st.json(data)
            except Exception as e:
                st.error(f"❌ {e}")

# Main content
st.markdown("# 🏥 Hospital Readmission Risk")
st.markdown(
    '<p style="font-size: 1.2rem; color: #475569; margin-top: 0.5rem;">Predict 30-day readmission risk for diabetic inpatients</p>',
    unsafe_allow_html=True,
)
st.markdown("---")

# Sample patient payload (matches PatientRequest schema)
SAMPLE = {
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

# Quick demo section
with st.container():
    st.markdown("### ⚡ Quick Demo")
    demo_col1, demo_col2, _ = st.columns([1, 2, 2])
    with demo_col1:
        quick_demo = st.button("📋 Predict with sample patient", type="primary", use_container_width=True)

if quick_demo:
    with st.spinner("Calling /predict ..."):
        try:
            r = requests.post(f"{api_url}/predict", json=SAMPLE, timeout=10)
            r.raise_for_status()
            data = r.json()
            risk = data["risk_score"]
            version = data["model_version"]

            st.markdown(f"""
            <div class="result-card">
                <div class="risk-label">30-day readmission risk</div>
                <div class="risk-value">{risk:.1%}</div>
                <div style="margin-top: 0.75rem; opacity: 0.8; font-size: 0.85rem;">Model: {version[:8]}...</div>
            </div>
            """, unsafe_allow_html=True)
            st.progress(min(risk, 1.0))
        except Exception as e:
            st.error(f"API error: {e}")

st.markdown("---")
st.markdown("### 📝 Custom Patient Data")

# Form
with st.form("patient_form"):
    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("**👤 Demographics**")
        age = st.selectbox(
            "Age group",
            ["[0-10)", "[10-20)", "[20-30)", "[30-40)", "[40-50)", "[50-60)", "[60-70)", "[70-80)", "[80-90)", "[90-100)"],
            index=5,
        )
        gender = st.selectbox("Gender", ["Female", "Male", "Unknown/Invalid"])
        race = st.selectbox(
            "Race",
            ["Caucasian", "AfricanAmerican", "Asian", "Hispanic", "Other", "Unknown"],
        )
        st.markdown("**🏥 Admission**")
        admission_type_id = st.number_input("Admission type ID", min_value=1, max_value=8, value=1)
        discharge_disposition_id = st.number_input("Discharge disposition ID", min_value=1, max_value=30, value=1)
        admission_source_id = st.number_input("Admission source ID", min_value=1, max_value=25, value=7)

    with col2:
        st.markdown("**📊 Clinical**")
        time_in_hospital = st.slider("Days in hospital", 1, 14, 3)
        num_lab_procedures = st.number_input("Lab procedures", min_value=0, value=41)
        num_procedures = st.number_input("Procedures", min_value=0, value=0)
        num_medications = st.number_input("Medications", min_value=0, value=8)
        number_diagnoses = st.number_input("Number of diagnoses", min_value=0, value=9)
        st.markdown("**📅 Prior year visits**")
        number_emergency = st.number_input("Emergency visits", min_value=0, value=0)
        number_inpatient = st.number_input("Inpatient visits", min_value=0, value=0)
        number_outpatient = st.number_input("Outpatient visits", min_value=0, value=0)
        care_intensity = number_emergency + number_inpatient + number_outpatient

    with col3:
        st.markdown("**💊 Medication & Lab**")
        change = st.selectbox("Medication change", ["No", "Ch"], index=1)
        medication_changed = 1 if change == "Ch" else 0
        diabetesMed = st.selectbox("Diabetes medication", ["No", "Yes"], index=1)
        A1Cresult = st.selectbox("HbA1c result", ["not_tested", "None", "Norm", ">7", ">8"])
        max_glu_serum = st.selectbox("Max glucose serum", ["not_tested", "None", "Norm", ">200", ">300"])

    submitted = st.form_submit_button("🔮 Predict")

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

    with st.spinner("Calling /predict ..."):
        try:
            r = requests.post(f"{api_url}/predict", json=payload, timeout=10)
            r.raise_for_status()
            data = r.json()
            risk = data["risk_score"]
            version = data["model_version"]

            st.markdown(f"""
            <div class="result-card">
                <div class="risk-label">30-day readmission risk</div>
                <div class="risk-value">{risk:.1%}</div>
                <div style="margin-top: 0.75rem; opacity: 0.8; font-size: 0.85rem;">Model: {version}</div>
            </div>
            """, unsafe_allow_html=True)
            st.progress(min(risk, 1.0))
        except requests.exceptions.RequestException as e:
            st.error(f"API error: {e}")
            if hasattr(e, "response") and e.response is not None:
                st.code(e.response.text)
