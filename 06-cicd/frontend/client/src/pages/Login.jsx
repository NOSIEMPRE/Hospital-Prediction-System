import React from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, ArrowRight, BrainCircuit, Activity } from 'lucide-react';
import useAppStore from '../store/appStore';

const DOCTORS = [
  { id: 1, name: 'Dr. Ortiz Togashi', initials: 'DOT', role: 'Chief Health Informatics Officer', school: 'Johns Hopkins / Harvard' },
  { id: 2, name: 'Dr. Yaxin Wu', initials: 'DYW', role: 'Director of Predictive Medicine', school: 'Stanford / Tsinghua' }
];

export default function Login() {
  const { login } = useAppStore();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-base">
      <div className="gradient-mesh opacity-50"></div>
      <div className="noise-overlay opacity-20"></div>
      
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="relative z-10 w-full max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
            <Activity size={12} /> Secure Inference Gateway
          </div>
          <h1 className="text-5xl font-heading font-bold text-text mb-4 text-glow">
            HospitalRisk Platform
          </h1>
          <p className="text-text-muted text-lg font-light">
            Select your authorized clinical identity to access the predictive dashboard.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {DOCTORS.map((doc, idx) => (
            <motion.button
              key={doc.id}
              initial={{ opacity: 0, x: idx === 0 ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              onClick={() => login(doc.id)}
              className="group relative flex flex-col items-center p-8 rounded-3xl bg-surface/40 border border-white/5 hover:border-accent/40 transition-all hover:shadow-[0_0_50px_rgba(0,229,192,0.1)] backdrop-blur-xl"
            >
              <div className="absolute top-4 right-4 text-accent/0 group-hover:text-accent/50 transition-colors">
                <ShieldCheck size={24} />
              </div>
              
              <div className="w-24 h-24 rounded-full bg-base border border-white/10 flex items-center justify-center text-3xl font-heading font-bold text-accent mb-6 group-hover:scale-110 group-hover:shadow-glow transition-all duration-500">
                {doc.initials}
              </div>

              <h2 className="text-2xl font-heading font-bold text-text mb-2 tracking-tight group-hover:text-accent transition-colors">
                {doc.name}
              </h2>
              <p className="text-accent text-[11px] font-bold uppercase tracking-widest mb-4">
                {doc.role}
              </p>
              <p className="text-text-muted text-xs font-light mb-8">
                Authorized Personnel | {doc.school}
              </p>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted group-hover:text-accent transition-all">
                Identify Biometrics <ArrowRight size={16} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="absolute inset-x-0 bottom-0 h-1 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></div>
            </motion.button>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 flex justify-center items-center gap-8 text-text-muted/40 uppercase text-[9px] font-bold tracking-[0.3em]"
        >
          <div className="flex items-center gap-2"><BrainCircuit size={14} /> Neural-Powered</div>
          <div className="flex items-center gap-2"><ShieldCheck size={14} /> HIPAA Compliant</div>
          <div className="flex items-center gap-2"><Activity size={14} /> Zero Trust Architecture</div>
        </motion.div>
      </div>
    </div>
  );
}
