import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileSpreadsheet, Download, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../components/layout/PageTransition';
import GlowButton from '../components/ui/GlowButton';
import RiskBadge from '../components/ui/RiskBadge';
import api from '../api/client';

export default function Batch() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const onDrop = useCallback(acceptedFiles => {
    const csvFile = acceptedFiles[0];
    if (csvFile?.type !== 'text/csv' && !csvFile?.name.endsWith('.csv')) {
      return toast.error('Format must be CSV');
    }
    setFile(csvFile);
    setResults([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] }, maxFiles: 1 });

  const processBatch = () => {
    if (!file) return;
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const rows = text.split('\n').map(line => line.trim()).filter(Boolean);
        if (rows.length < 2) throw new Error("CSV must contain headers and data rows");
        
        const headers = rows[0].split(',').map(h => h.trim());
        const patients = rows.slice(1).map((row, index) => {
          const values = row.split(',').map(v => v.trim());
          const obj = { id: `B-${index + 1}` };
          headers.forEach((h, i) => { 
             const val = values[i];
             if (!isNaN(val) && val !== '') obj[h] = Number(val);
             else obj[h] = val;
          });

          // Compute derived fields for API compliance
          obj.care_intensity = Number(obj.number_emergency || 0) + Number(obj.number_inpatient || 0) + Number(obj.number_outpatient || 0);
          obj.medication_changed = obj.change === 'Ch' ? 1 : 0;
          
          // Ensure all numeric types are strictly formatted
          const numericFields = [
            'admission_type_id', 'discharge_disposition_id', 'admission_source_id',
            'time_in_hospital', 'num_lab_procedures', 'num_procedures', 'num_medications',
            'number_outpatient', 'number_emergency', 'number_inpatient', 'number_diagnoses',
            'care_intensity', 'medication_changed'
          ];
          numericFields.forEach(k => {
             if (obj[k] !== undefined) obj[k] = parseInt(obj[k], 10) || 0;
          });
          
          return obj;
        });

        if (patients.length > 50) {
           toast.error('Batch limited to 50 rows for performance');
           patients.length = 50; 
        }

        const { data } = await api.post('/batch', patients);
        setResults(data);
        toast.success(`Processed ${data.length} patients successfully`);
      } catch (err) {
        toast.error(err.message || 'Batch failed');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">Batch Risk Processing</h1>
            <p className="text-text-muted">Upload CSV for bulk readmission risk assessments</p>
          </div>
          <GlowButton variant="secondary" className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest leading-none">
            <Download size={14} className="mr-2"/> Download Template
          </GlowButton>
        </div>

        <div 
          {...getRootProps()} 
          className={`
            border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-500 cursor-pointer group relative overflow-hidden
            ${isDragActive ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-white/10 bg-surface/30 hover:bg-surface/50 hover:border-accent/30'}
          `}
        >
          <input {...getInputProps()} />
          <div className={`mx-auto mb-6 p-6 rounded-2xl bg-white/5 w-fit transition-colors group-hover:bg-accent/10 ${isDragActive ? 'bg-accent/20' : ''}`}>
            <UploadCloud size={48} className={`${isDragActive ? 'text-accent' : 'text-text-muted group-hover:text-accent'} transition-colors duration-500`} />
          </div>
          <p className="text-xl font-heading font-semibold mb-2">
            {isDragActive ? 'Release to upload files' : 'Drop clinical CSV here, or click to browse'}
          </p>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Maximum 50 records per batch. Ensure column names match the API schema.
          </p>
        </div>

        <AnimatePresence>
          {file && results.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mt-8 glass-card p-6 flex justify-between items-center bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-accent/10 rounded-xl text-accent">
                  <FileSpreadsheet size={28} />
                </div>
                <div>
                  <p className="font-semibold text-text">{file.name}</p>
                  <p className="text-xs text-text-muted font-mono uppercase">{(file.size / 1024).toFixed(1)} KB — VERIFIED FORMAT</p>
                </div>
              </div>
              <GlowButton onClick={processBatch} disabled={loading} className="min-w-[160px]">
                {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Execute Batch'}
              </GlowButton>
            </motion.div>
          )}

          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 glass-card overflow-hidden border border-white/5 shadow-2xl">
               <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                 <div className="flex items-center gap-3">
                   <CheckCircle2 size={24} className="text-accent" />
                   <h2 className="text-xl font-heading font-semibold">Processed Results</h2>
                   <span className="bg-accent/10 text-accent px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{results.length} Patients</span>
                 </div>
                 <GlowButton variant="secondary" className="text-[10px] uppercase font-bold tracking-widest px-5 py-2">
                   <Download size={14} className="mr-2"/> Export XLS
                 </GlowButton>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-surface/50 text-text-muted text-[10px] uppercase tracking-[0.15em] font-bold">
                       <th className="p-5">Patient Ref</th>
                       <th className="p-5 w-64">Risk Gradient</th>
                       <th className="p-5">Label</th>
                       <th className="p-5 text-right">Interpretation</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {results.map((r, i) => (
                       <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                         <td className="p-5 font-mono text-sm text-text">{r.id || `ROW-${i+1}`}</td>
                         <td className="p-5">
                            {r.error ? (
                              <div className="flex items-center gap-2 text-danger text-xs italic">
                                <AlertCircle size={14} /> Failed: {r.error}
                              </div>
                            ) : (
                              <div className="flex items-center gap-4">
                                <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                  <div className={`h-full transition-all duration-1000 ${r.risk_score >= 0.6 ? 'bg-danger' : r.risk_score >= 0.3 ? 'bg-warning' : 'bg-accent'}`} style={{ width: `${r.risk_score * 100}%` }}></div>
                                </div>
                                <span className="font-mono text-xs text-text-muted">{(r.risk_score * 100).toFixed(0)}%</span>
                              </div>
                            )}
                         </td>
                         <td className="p-5">
                           {r.error ? <span className="text-text-muted/30">---</span> : <RiskBadge score={r.risk_score} />}
                         </td>
                         <td className="p-5 text-right">
                           <button className="text-accent text-[11px] font-bold uppercase tracking-wider hover:underline disabled:opacity-20" disabled={!!r.error}>SHAP Analysis</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
