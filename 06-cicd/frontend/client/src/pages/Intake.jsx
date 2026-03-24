import React, { useState } from 'react';
// framer-motion removed — causes removeChild crash with React 19 on conditional renders
import { Check, ChevronRight, ChevronLeft, ArrowRight, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import PageTransition from '../components/layout/PageTransition';
import RechartsClientOnly from '../components/RechartsClientOnly';
import GlowButton from '../components/ui/GlowButton';
import RiskBadge from '../components/ui/RiskBadge';
import api from '../api/client';
import useAppStore from '../store/appStore';

const initForm = {
  age: '[50-60)', gender: 'Female', race: 'Caucasian',
  admission_type_id: 1, discharge_disposition_id: 1, admission_source_id: 7,
  time_in_hospital: 3, num_lab_procedures: 41, num_procedures: 0,
  num_medications: 8, number_outpatient: 0, number_emergency: 0,
  number_inpatient: 0, number_diagnoses: 9,
  max_glu_serum: 'not_tested', A1Cresult: 'not_tested', change: 'No', diabetesMed: 'No'
};

const Steps = ['Demographics', 'Hospital Visits', 'Lab & Meds'];

export default function Intake() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { addPrediction } = useAppStore();

  const handleNext = () => setStep(s => Math.min(s + 1, 2));
  const handlePrev = () => setStep(s => Math.max(s - 1, 0));
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const submitAssessment = async () => {
    setLoading(true);
    try {
      const payload = { 
        ...formData,
        care_intensity: parseInt(formData.number_emergency || 0) + parseInt(formData.number_inpatient || 0) + parseInt(formData.number_outpatient || 0),
        medication_changed: formData.change === 'Ch' ? 1 : 0
      };

      const numericFields = [
        'admission_type_id', 'discharge_disposition_id', 'admission_source_id',
        'time_in_hospital', 'num_lab_procedures', 'num_procedures', 'num_medications',
        'number_outpatient', 'number_emergency', 'number_inpatient', 'number_diagnoses',
        'care_intensity', 'medication_changed'
      ];

      numericFields.forEach(k => {
          if (payload[k] !== undefined) {
            payload[k] = parseInt(payload[k], 10) || 0;
          }
      });

      const { data } = await api.post('/predict', payload);
      setResult(data);
      addPrediction({ id: `PT-${Math.floor(Math.random()*9000)+1000}`, score: data.risk_score, label: data.risk_label });
      toast.success('Assessment complete');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        'Prediction failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderGauge = () => {
    if (!result) return null;
    const score = result.risk_score * 100;
    const color = score >= 60 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#00e5c0';
    
    return (
      <div className="relative flex items-center justify-center h-[180px] w-full mt-4">
        <svg viewBox="0 0 100 60" className="w-full h-full transform translate-y-4">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${score * 1.256}, 125.6`} className="transition-all duration-[2000ms] ease-out" />
          <text x="50" y="45" textAnchor="middle" className="fill-text font-mono font-bold text-[14px]">
            {score.toFixed(1)}%
          </text>
        </svg>
      </div>
    );
  };

  const renderShap = () => {
    if (!result?.shap_values) return <div className="text-text-muted mt-10 text-center">No SHAP explanations available.</div>;
    
    const entries = Object.entries(result.shap_values)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 8)
      .map(([name, val]) => ({
        name: name.split('_').join(' '),
        val: val,
        abs: Math.abs(val)
      }));

    return (
      <div className="h-[350px] w-full mt-8">
        <RechartsClientOnly minHeight={350}>
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={entries} layout="vertical" margin={{ left: 100, right: 30, top: 10, bottom: 10 }} isAnimationActive={false}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" stroke="#6b90b8" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" stroke="#f0f6ff" fontSize={11} width={90} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{ backgroundColor: '#112038', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#00e5c0' }}
            />
            <Bar dataKey="val" radius={[0, 4, 4, 0]}>
              {entries.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.val > 0 ? '#ef4444' : '#00e5c0'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </RechartsClientOnly>
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-heading font-bold mb-8 text-glow">New Patient Assessment</h1>

        {!result ? (
            <div>
              <div className="flex items-center justify-between mb-12 max-w-2xl mx-auto relative px-4">
                {Steps.map((name, i) => (
                  <div key={name} className="flex flex-col items-center relative z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold font-mono transition-all duration-500
                      ${i < step ? 'bg-accent text-base' : i === step ? 'bg-surface border-2 border-accent text-accent box-glow scale-110' : 'bg-surface text-text-muted border border-white/10'}`}>
                      {i < step ? <Check size={24} /> : i + 1}
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest mt-3 font-bold ${i === step ? 'text-accent' : 'text-text-muted'}`}>{name}</span>
                  </div>
                ))}
                <div className="absolute left-16 right-16 h-[1px] bg-white/10 top-6 -z-0" />
              </div>

              <div className="glass-card p-10 max-w-3xl mx-auto min-h-[500px] border-t-4 border-t-accent shadow-2xl">
                {step === 0 && (
                  <div>
                    <h2 className="text-xl font-heading text-text mb-8 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">1</div>
                      Demographics & Admission
                    </h2>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Age Bracket</label>
                        <select name="age" value={formData.age} onChange={handleChange} className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 text-text focus:border-accent focus:ring-1 focus:ring-accent outline-none appearance-none transition-all">
                          <option>[0-10)</option><option>[10-20)</option><option>[20-30)</option><option>[30-40)</option><option>[40-50)</option><option>[50-60)</option><option>[60-70)</option><option>[70-80)</option><option>[80-90)</option><option>[90-100)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 text-text focus:border-accent outline-none appearance-none transition-all">
                          <option>Male</option><option>Female</option><option>Unknown</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Race/Ethnicity</label>
                        <select name="race" value={formData.race} onChange={handleChange} className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 text-text focus:border-accent outline-none appearance-none transition-all">
                          <option>Caucasian</option><option>AfricanAmerican</option><option>Hispanic</option><option>Asian</option><option>Other</option><option>Unknown</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Admission Type ID</label>
                        <input type="number" name="admission_type_id" value={formData.admission_type_id} onChange={handleChange} className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 text-text focus:border-accent outline-none transition-all" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h2 className="text-xl font-heading text-text mb-8 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">2</div>
                      Clinical History
                    </h2>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="col-span-2">
                        <div className="flex justify-between text-xs font-bold text-text-muted mb-4 uppercase tracking-wider">
                          <span>Length of Stay</span> <span className="text-accent text-sm font-mono">{formData.time_in_hospital} DAYS</span>
                        </div>
                        <input type="range" min="1" max="14" name="time_in_hospital" value={formData.time_in_hospital} onChange={handleChange} className="w-full accent-accent h-2 bg-base rounded-full appearance-none cursor-pointer" />
                      </div>
                      <div><label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Lab Procedures</label><input type="number" name="num_lab_procedures" value={formData.num_lab_procedures} onChange={handleChange} className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-accent transition-all" /></div>
                      <div><label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Other Procedures</label><input type="number" name="num_procedures" value={formData.num_procedures} onChange={handleChange} className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-accent transition-all" /></div>
                      <div><label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Medications Count</label><input type="number" name="num_medications" value={formData.num_medications} onChange={handleChange} className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-accent transition-all" /></div>
                      <div><label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Total Diagnoses</label><input type="number" name="number_diagnoses" value={formData.number_diagnoses} onChange={handleChange} className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-accent transition-all" /></div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="text-xl font-heading text-text mb-8 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">3</div>
                      Diabetes Management
                    </h2>
                    <div className="grid grid-cols-2 gap-8 mb-8">
                       <div>
                        <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Max Glu Serum</label>
                        <select name="max_glu_serum" value={formData.max_glu_serum} onChange={handleChange} className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-accent appearance-none transition-all">
                          <option>not_tested</option><option>None</option><option>Norm</option><option>&gt;200</option><option>&gt;300</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">A1C Result</label>
                        <select name="A1Cresult" value={formData.A1Cresult} onChange={handleChange} className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-accent appearance-none transition-all">
                          <option>not_tested</option><option>None</option><option>Norm</option><option>&gt;7</option><option>&gt;8</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-12 flex justify-between pt-8 border-t border-white/5">
                  <GlowButton variant="secondary" onClick={handlePrev} disabled={step === 0 || loading}>
                    <ChevronLeft size={20} className="mr-2"/> Back
                  </GlowButton>
                  
                  {step < 2 ? (
                    <GlowButton variant="primary" onClick={handleNext} className="min-w-[140px]">
                      Next <ChevronRight size={20} className="ml-2"/>
                    </GlowButton>
                  ) : (
                    <GlowButton variant="primary" onClick={submitAssessment} disabled={loading} className="min-w-[180px]">
                      {loading ? (
                         <div className="flex items-center gap-3">
                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           Analyzing...
                         </div>
                      ) : (
                        <><ShieldAlert size={20} className="mr-2"/> Run Assessment</>
                      )}
                    </GlowButton>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="glass-card p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldAlert size={120} className="text-accent" />
                </div>
                <h3 className="text-text-muted mb-2 font-bold uppercase tracking-widest text-xs">Prediction Result</h3>
                <RiskBadge score={result.risk_score} showPulse className="px-6 py-2 text-base mb-2" />
                {renderGauge()}
                <div className="mt-8 p-5 bg-surface/50 rounded-2xl w-full border border-white/5 text-left">
                  <p className="text-[10px] text-text-muted mb-1 font-bold uppercase tracking-wider">Inference Model</p>
                  <p className="font-mono text-sm text-accent">XGBoost-Readmit-V4</p>
                </div>
              </div>

              <div className="glass-card p-10 lg:col-span-2">
                <h3 className="text-xl font-heading font-semibold mb-3">Model Interpretability (SHAP)</h3>
                <p className="text-sm text-text-muted mb-8 leading-relaxed">
                  The chart below ranks clinical features by their impact on the risk score. 
                  <span className="text-danger font-semibold"> Red bars</span> indicate factors that increased risk, 
                  while <span className="text-accent font-semibold">teal bars</span> indicate protective factors.
                </p>
                {renderShap()}

                <div className="mt-10 flex justify-end">
                  <GlowButton variant="primary" onClick={() => { setResult(null); setStep(0); setFormData(initForm); }}>
                    New Assessment <ArrowRight size={20} className="ml-2" />
                  </GlowButton>
                </div>
              </div>
            </div>
          )}
      </div>
    </PageTransition>
  );
}
