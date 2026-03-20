"""Streamlit UI for live testing the Hospital Readmission Risk /predict endpoint.
Run: streamlit run streamlit_app.py
Requires the API server running (python app.py or Docker on port 9696).
"""
import requests
import streamlit as st

st.set_page_config(
    page_title="Readmission Risk — Prediction Tool",
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
[data-testid="stSidebar"],
[data-testid="stSidebar"] *,
[data-testid="stSidebar"] p,
[data-testid="stSidebar"] span,
[data-testid="stSidebar"] label,
[data-testid="stSidebar"] div,
[data-testid="stSidebar"] .stMarkdown,
[data-testid="stSidebar"] .stMarkdown p { color: #e2e8f0 !important; }
[data-testid="stSidebar"] h1,
[data-testid="stSidebar"] h2,
[data-testid="stSidebar"] h3,
[data-testid="stSidebar"] strong,
[data-testid="stSidebar"] b { color: #ffffff !important; }
[data-testid="stSidebar"] [style*="letter-spacing"] { color: #93c5fd !important; }
[data-testid="stSidebar"] .stTextInput input {
    background: rgba(255,255,255,0.10) !important;
    border: 1px solid rgba(255,255,255,0.25) !important;
    border-radius: 6px !important;
    color: #f1f5f9 !important;
    font-size: 0.95rem !important;
}
[data-testid="stSidebar"] .stTextInput input::placeholder { color: #94a3b8 !important; }
[data-testid="stSidebar"] .stButton button {
    background: rgba(255,255,255,0.12) !important;
    border: 1px solid rgba(255,255,255,0.3) !important;
    color: #f1f5f9 !important;
    border-radius: 6px !important;
    font-size: 0.95rem !important;
    font-weight: 500 !important;
    transition: background 0.2s;
}
[data-testid="stSidebar"] .stButton button:hover {
    background: rgba(255,255,255,0.22) !important;
    color: #ffffff !important;
}
[data-testid="stSidebar"] [data-testid="stExpander"] summary,
[data-testid="stSidebar"] [data-testid="stExpander"] summary span,
[data-testid="stSidebar"] [data-testid="stExpander"] summary p { color: #93c5fd !important; }
[data-testid="stSidebar"] .stAlert p { color: #1e293b !important; }

/* ── Sidebar nav radio ── */
[data-testid="stSidebar"] [data-testid="stRadio"] label {
    font-size: 0.98rem !important;
    font-weight: 500 !important;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s;
}
[data-testid="stSidebar"] [data-testid="stRadio"] { gap: 0.3rem; }

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

/* ── Content wrapper ── */
.content-wrap { padding: 1.1rem 1.75rem; }

/* ── Stat pills ── */
.stat-row { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
.stat-pill {
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;
    padding: 0.6rem 1rem; flex: 1; min-width: 140px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.stat-pill-label {
    font-size: 0.78rem; font-weight: 600; letter-spacing: 0.05em;
    text-transform: uppercase; color: #94a3b8; margin-bottom: 0.2rem;
}
.stat-pill-value { font-size: 1.2rem; font-weight: 700; color: #1e293b; }

/* ── Section card ── */
.section-card {
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;
    padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06); height: 100%;
}
.section-card-header {
    display: flex; align-items: center; gap: 0.6rem;
    margin-bottom: 1.25rem; padding-bottom: 0.85rem; border-bottom: 2px solid #f1f5f9;
}
.section-card-icon {
    width: 30px; height: 30px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.95rem; flex-shrink: 0;
}
.icon-blue   { background: #dbeafe; }
.icon-green  { background: #dcfce7; }
.icon-purple { background: #ede9fe; }
.icon-orange { background: #ffedd5; }
.section-card-title {
    font-size: 0.9rem !important; font-weight: 700 !important;
    letter-spacing: 0.05em; text-transform: uppercase; color: #475569 !important; margin: 0 !important;
}

/* ── Form inputs ── */
.stSelectbox label, .stNumberInput label, .stSlider label {
    font-size: 0.95rem !important; font-weight: 500 !important; color: #475569 !important;
}
.stSelectbox [data-baseweb="select"] > div {
    border-radius: 7px !important; border-color: #e2e8f0 !important; font-size: 0.95rem !important;
}
.stNumberInput input { border-radius: 7px !important; border-color: #e2e8f0 !important; font-size: 0.95rem !important; }

/* ── Predict button ── */
.stFormSubmitButton button {
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%) !important;
    color: #ffffff !important; border: none !important; font-weight: 600 !important;
    font-size: 0.95rem !important; border-radius: 8px !important; padding: 0.65rem 2.5rem !important;
    box-shadow: 0 2px 8px rgba(37,99,235,0.35) !important; letter-spacing: 0.01em; transition: all 0.2s !important;
}
.stFormSubmitButton button:hover {
    background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%) !important;
    box-shadow: 0 4px 14px rgba(37,99,235,0.45) !important;
}
[data-testid="stFormSubmitButton"] { margin-top: 0.5rem; }

/* ── Quick demo button ── */
button[kind="primary"] {
    background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%) !important;
    border: none !important; font-weight: 600 !important; border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(13,148,136,0.35) !important; letter-spacing: 0.01em;
}

/* ── Risk result ── */
.result-outer { margin: 1.5rem 0 0.5rem; animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.result-card {
    background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08); padding: 2rem 2.25rem;
    display: flex; gap: 2rem; align-items: center; flex-wrap: wrap;
}
.result-left { flex: 0 0 auto; text-align: center; }
.result-right { flex: 1 1 220px; }

.gauge-wrap { position: relative; width: 130px; height: 130px; }
.gauge-wrap svg { transform: rotate(-90deg); }
.gauge-bg   { fill: none; stroke: #f1f5f9; stroke-width: 12; }
.gauge-fill { fill: none; stroke-width: 12; stroke-linecap: round; transition: stroke-dashoffset 0.6s ease; }
.gauge-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
.gauge-pct  { font-size: 1.6rem; font-weight: 700; line-height: 1; }
.gauge-lbl  { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; margin-top: 2px; }

.risk-badge {
    display: inline-block; padding: 0.3rem 0.9rem; border-radius: 20px;
    font-size: 0.78rem; font-weight: 700; letter-spacing: 0.05em;
    text-transform: uppercase; margin-top: 0.6rem;
}
.badge-high   { background: #fee2e2; color: #991b1b; }
.badge-medium { background: #fef3c7; color: #92400e; }
.badge-low    { background: #dcfce7; color: #166534; }

.result-title { font-size: 0.82rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.35rem; }
.result-headline { font-size: 1.45rem; font-weight: 700; color: #1e293b; margin-bottom: 0.45rem; }
.result-desc { font-size: 0.95rem; color: #64748b; line-height: 1.6; margin-bottom: 0.85rem; }
.progress-track { background: #f1f5f9; border-radius: 99px; height: 8px; overflow: hidden; margin-bottom: 0.4rem; }
.progress-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
.progress-labels { display: flex; justify-content: space-between; font-size: 0.82rem; color: #94a3b8; }
.result-meta { font-size: 0.85rem; color: #94a3b8; margin-top: 0.65rem; }
.result-meta span { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.15rem 0.5rem; border-radius: 4px; font-family: monospace; }

/* ── Divider ── */
.styled-divider { border: none; border-top: 1px solid #e2e8f0; margin: 0.75rem 0; }

/* ── Sub-section label inside card ── */
.sub-label {
    font-size: 0.82rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    color: #94a3b8; margin: 0.9rem 0 0.5rem; display: flex; align-items: center; gap: 0.4rem;
}
.sub-label::after { content: ''; flex: 1; height: 1px; background: #f1f5f9; }

/* ── Row section label ── */
.row-section-label {
    font-size: 0.85rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    color: #64748b; margin: 0.9rem 0 0.6rem; display: flex; align-items: center; gap: 0.5rem;
}
.row-section-label::before { content: ''; width: 3px; height: 14px; background: #2563eb; border-radius: 2px; }
.row-section-label::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
</style>
""", unsafe_allow_html=True)

DEFAULT_API = "https://hospital-prediction-system.onrender.com"

# ─────────────────────────────────────────────
# Sidebar — Navigation + API Config
# ─────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style="padding: 0.9rem 0 0.4rem; text-align:center;">
        <div style="font-size:2rem;">🏥</div>
        <div style="font-size:1rem; font-weight:700; color:#e2e8f0; margin-top:0.25rem;">Readmission Risk</div>
        <div style="font-size:0.8rem; color:#64748b; margin-top:0.1rem; letter-spacing:0.04em;">DIABETIC INPATIENTS</div>
    </div>
    <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:0.75rem 0;">
    """, unsafe_allow_html=True)

    st.markdown('<p style="font-size:0.82rem; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#64748b; margin-bottom:0.5rem;">NAVIGATE</p>', unsafe_allow_html=True)
    page = st.radio(
        "page",
        ["▶  Quick Demo", "👤  Custom Patient"],
        label_visibility="collapsed",
    )

    st.markdown('<hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:1rem 0;">', unsafe_allow_html=True)
    st.markdown('<p style="font-size:0.82rem; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#64748b; margin-bottom:0.5rem;">API ENDPOINT</p>', unsafe_allow_html=True)
    api_url = st.text_input(
        "API Base URL",
        value=DEFAULT_API,
        label_visibility="collapsed",
        placeholder="http://localhost:9696",
    ).rstrip("/")

    if st.button("⚡  Check connection", use_container_width=True):
        try:
            r = requests.get(f"{api_url}/health", timeout=5)
            data = r.json()
            if data.get("model_loaded"):
                st.success("✓  Model loaded & ready")
            else:
                st.warning("⚠  Connected but model not loaded")
            with st.expander("Response details"):
                st.json(data)
        except Exception as e:
            st.error(f"✗  {e}")

    st.markdown("""
    <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:0.9rem 0 0.75rem;">
    <div style="font-size:0.82rem; color:#64748b; line-height:1.8;">
        <div>🖥  <span style="color:#94a3b8;">Local</span>&nbsp; http://localhost:9696</div>
        <div>🌐  <span style="color:#94a3b8;">Deployed</span>&nbsp; set URL above</div>
    </div>
    """, unsafe_allow_html=True)

# ─────────────────────────────────────────────
# Sample payload
# ─────────────────────────────────────────────
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

# ─────────────────────────────────────────────
# Render risk result
# ─────────────────────────────────────────────
def render_result(risk: float, version: str):
    pct = risk * 100
    if risk >= 0.6:
        level, label, color, desc = (
            "high", "High Risk", "#dc2626",
            "This patient has a <strong>significantly elevated</strong> probability of readmission within 30 days. "
            "Consider a structured discharge plan, close follow-up, and medication reconciliation."
        )
    elif risk >= 0.3:
        level, label, color, desc = (
            "medium", "Moderate Risk", "#d97706",
            "This patient shows <strong>moderate readmission risk</strong>. "
            "Targeted interventions and post-discharge check-ins are recommended."
        )
    else:
        level, label, color, desc = (
            "low", "Low Risk", "#16a34a",
            "This patient has a <strong>low probability</strong> of readmission within 30 days. "
            "Standard discharge and routine follow-up should be sufficient."
        )

    r = 54
    circ = 2 * 3.14159 * r
    offset = circ * (1 - risk)

    st.markdown(f"""
    <div class="result-outer">
      <div class="result-card">
        <div class="result-left">
          <div class="gauge-wrap">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle class="gauge-bg"   cx="65" cy="65" r="{r}"/>
              <circle class="gauge-fill" cx="65" cy="65" r="{r}"
                stroke="{color}"
                stroke-dasharray="{circ:.1f}"
                stroke-dashoffset="{offset:.1f}"/>
            </svg>
            <div class="gauge-text">
              <div class="gauge-pct" style="color:{color}">{pct:.0f}%</div>
              <div class="gauge-lbl">Risk</div>
            </div>
          </div>
          <div><span class="risk-badge badge-{level}">{label}</span></div>
        </div>
        <div class="result-right">
          <div class="result-title">30-day readmission probability</div>
          <div class="result-headline" style="color:{color}">{pct:.1f}% probability</div>
          <div class="result-desc">{desc}</div>
          <div class="progress-track">
            <div class="progress-fill" style="width:{pct:.1f}%; background:{color};"></div>
          </div>
          <div class="progress-labels">
            <span>0%  Low</span><span>30%  Moderate</span><span>60%  High</span><span>100%</span>
          </div>
          <div class="result-meta">Model version: <span>{version}</span></div>
        </div>
      </div>
    </div>
    """, unsafe_allow_html=True)


# ─────────────────────────────────────────────
# Page header
# ─────────────────────────────────────────────
page_subtitle = (
    "Sample patient prediction — one click to see the model in action"
    if "Quick Demo" in page
    else "Fill in patient details across three sections and click Predict"
)
st.markdown(f"""
<div class="page-header">
    <div class="page-header-icon">🏥</div>
    <div class="page-header-text">
        <h1>Hospital Readmission Risk</h1>
        <p>{page_subtitle} &nbsp;·&nbsp; Powered by ML</p>
    </div>
</div>
""", unsafe_allow_html=True)

# ═════════════════════════════════════════════
# PAGE: Quick Demo
# ═════════════════════════════════════════════
if "Quick Demo" in page:
    with st.container():
        st.markdown('<div class="content-wrap">', unsafe_allow_html=True)

        st.markdown("""
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.9rem;">
            <div style="font-size:1.25rem;">🔬</div>
            <div>
                <div style="font-size:1.1rem; font-weight:700; color:#1e293b;">Sample Patient</div>
                <div style="font-size:0.9rem; color:#94a3b8; margin-top:2px;">Female · Age 50–60 · Caucasian · 3 days in hospital · 41 lab procedures</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        # Patient summary pills
        st.markdown("""
        <div class="stat-row">
            <div class="stat-pill"><div class="stat-pill-label">Age Group</div><div class="stat-pill-value">[50–60)</div></div>
            <div class="stat-pill"><div class="stat-pill-label">Gender</div><div class="stat-pill-value">Female</div></div>
            <div class="stat-pill"><div class="stat-pill-label">Days in Hospital</div><div class="stat-pill-value">3</div></div>
            <div class="stat-pill"><div class="stat-pill-label">Lab Procedures</div><div class="stat-pill-value">41</div></div>
            <div class="stat-pill"><div class="stat-pill-label">Medications</div><div class="stat-pill-value">8</div></div>
            <div class="stat-pill"><div class="stat-pill-label">Diagnoses</div><div class="stat-pill-value">9</div></div>
        </div>
        """, unsafe_allow_html=True)

        col_btn, _ = st.columns([2, 6])
        with col_btn:
            quick_demo = st.button("▶  Run prediction", type="primary", use_container_width=True)

        if quick_demo:
            with st.spinner("Running prediction..."):
                try:
                    r = requests.post(f"{api_url}/predict", json=SAMPLE, timeout=10)
                    r.raise_for_status()
                    data = r.json()
                    render_result(data["risk_score"], data["model_version"])
                except Exception as e:
                    st.error(f"API error: {e}")

        st.markdown('</div>', unsafe_allow_html=True)

# ═════════════════════════════════════════════
# PAGE: Custom Patient  (3-row layout)
# ═════════════════════════════════════════════
else:
    with st.container():
        st.markdown('<div class="content-wrap">', unsafe_allow_html=True)

        st.markdown("""
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.9rem;">
            <div style="font-size:1.25rem;">👤</div>
            <div>
                <div style="font-size:1.1rem; font-weight:700; color:#1e293b;">Custom Patient</div>
                <div style="font-size:0.9rem; color:#94a3b8; margin-top:2px;">Fill in details across the three sections below and click Predict</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        with st.form("patient_form"):

            # ── ROW 1: Demographics ───────────────────
            st.markdown('<div class="row-section-label">Demographics</div>', unsafe_allow_html=True)
            r1c1, r1c2, r1c3, r1c4, r1c5, r1c6 = st.columns([2, 2, 2, 2, 2, 2], gap="medium")

            with r1c1:
                age = st.selectbox(
                    "Age group",
                    ["[0-10)", "[10-20)", "[20-30)", "[30-40)", "[40-50)",
                     "[50-60)", "[60-70)", "[70-80)", "[80-90)", "[90-100)"],
                    index=5,
                )
            with r1c2:
                gender = st.selectbox("Gender", ["Female", "Male", "Unknown/Invalid"])
            with r1c3:
                race = st.selectbox(
                    "Race",
                    ["Caucasian", "AfricanAmerican", "Asian", "Hispanic", "Other", "Unknown"],
                )
            with r1c4:
                admission_type_id = st.number_input("Admission type ID", min_value=1, max_value=8, value=1)
            with r1c5:
                discharge_disposition_id = st.number_input("Discharge disposition ID", min_value=1, max_value=30, value=1)
            with r1c6:
                admission_source_id = st.number_input("Admission source ID", min_value=1, max_value=25, value=7)

            st.markdown('<hr class="styled-divider">', unsafe_allow_html=True)

            # ── ROW 2: Clinical ───────────────────────
            st.markdown('<div class="row-section-label">Clinical Data</div>', unsafe_allow_html=True)
            r2c1, r2c2, r2c3, r2c4, r2c5, r2c6, r2c7, r2c8 = st.columns(
                [3, 2, 2, 2, 2, 2, 2, 2], gap="medium"
            )

            with r2c1:
                time_in_hospital = st.slider("Days in hospital", 1, 14, 3)
            with r2c2:
                num_lab_procedures = st.number_input("Lab procedures", min_value=0, value=41)
            with r2c3:
                num_procedures = st.number_input("Procedures", min_value=0, value=0)
            with r2c4:
                num_medications = st.number_input("Medications", min_value=0, value=8)
            with r2c5:
                number_diagnoses = st.number_input("Diagnoses", min_value=0, value=9)
            with r2c6:
                number_emergency = st.number_input("Emergency visits", min_value=0, value=0)
            with r2c7:
                number_inpatient = st.number_input("Inpatient visits", min_value=0, value=0)
            with r2c8:
                number_outpatient = st.number_input("Outpatient visits", min_value=0, value=0)

            care_intensity = number_emergency + number_inpatient + number_outpatient

            st.markdown('<hr class="styled-divider">', unsafe_allow_html=True)

            # ── ROW 3: Medication & Lab + Summary ────
            st.markdown('<div class="row-section-label">Medication &amp; Lab Results</div>', unsafe_allow_html=True)
            r3c1, r3c2, r3c3, r3c4, r3c5 = st.columns([2, 2, 2, 2, 3], gap="medium")

            with r3c1:
                change = st.selectbox("Medication change", ["No", "Ch"], index=1)
                medication_changed = 1 if change == "Ch" else 0
            with r3c2:
                diabetesMed = st.selectbox("Diabetes medication", ["No", "Yes"], index=1)
            with r3c3:
                A1Cresult = st.selectbox(
                    "HbA1c result",
                    ["not_tested", "None", "Norm", ">7", ">8"],
                    help="Glycated haemoglobin measurement result",
                )
            with r3c4:
                max_glu_serum = st.selectbox(
                    "Max glucose serum",
                    ["not_tested", "None", "Norm", ">200", ">300"],
                    help="Maximum glucose serum test result",
                )
            with r3c5:
                st.markdown(f"""
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;
                            padding:0.75rem 1rem; font-size:0.92rem; line-height:2; color:#475569; height:100%;">
                    <div style="font-size:0.8rem; font-weight:700; letter-spacing:0.05em;
                                text-transform:uppercase; color:#94a3b8; margin-bottom:0.35rem;">Summary</div>
                    <div>🏥 Days in hospital: <strong>{time_in_hospital}</strong></div>
                    <div>🧪 Lab procedures: <strong>{num_lab_procedures}</strong></div>
                    <div>💊 Medications: <strong>{num_medications}</strong></div>
                    <div>🔬 Diagnoses: <strong>{number_diagnoses}</strong></div>
                    <div>📋 Care intensity: <strong>{care_intensity}</strong></div>
                </div>
                """, unsafe_allow_html=True)

            st.markdown("<br>", unsafe_allow_html=True)
            submitted = st.form_submit_button("🔍  Predict readmission risk", use_container_width=False)

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
            with st.spinner("Running prediction..."):
                try:
                    r = requests.post(f"{api_url}/predict", json=payload, timeout=10)
                    r.raise_for_status()
                    data = r.json()
                    render_result(data["risk_score"], data["model_version"])
                except requests.exceptions.RequestException as e:
                    st.error(f"API error: {e}")
                    if hasattr(e, "response") and e.response is not None:
                        st.code(e.response.text)

        st.markdown('</div>', unsafe_allow_html=True)
