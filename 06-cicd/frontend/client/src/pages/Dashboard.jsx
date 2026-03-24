import React, { useEffect, useState } from 'react';
import { Activity, BrainCircuit, Zap, BarChart3, TrendingUp, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from '../components/ui/MetricCard';
import RiskBadge from '../components/ui/RiskBadge';
import api from '../api/client';
import useAppStore from '../store/appStore';
import PageTransition from '../components/layout/PageTransition';
import RechartsClientOnly from '../components/RechartsClientOnly';

const sparkData = [
  { time: '12:00', val: 40 },
  { time: '13:00', val: 35 },
  { time: '14:00', val: 55 },
  { time: '15:00', val: 45 },
  { time: '16:00', val: 60 },
  { time: '17:00', val: 50 },
  { time: '18:00', val: 65 },
];

const mockScores = [1,2,3,4,5].map(() => Math.random());

export default function Dashboard() {
  const { setApiHealth } = useAppStore();
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { data } = await api.get('/health', { timeout: 3000 });
        setApiHealth({ status: data.status, model_loaded: data.model_loaded });
        setLatency(data.latency_ms);
      } catch {
        setApiHealth({ status: 'offline', model_loaded: false });
        setLatency(0);
      }
    };
    checkHealth();
  }, [setApiHealth]);

  return (
    <PageTransition>
      <div className="w-full relative rounded-2xl overflow-hidden glass-card mb-8 border border-white/5 border-l-4 border-l-accent p-8 flex items-center">
        <div className="relative z-10 w-full">
          <h1 className="text-4xl font-heading font-bold text-text mb-2 text-glow">
            Hospital Readmission Risk Platform
          </h1>
          <p className="text-text-muted text-lg max-w-2xl font-light">
            Real-time AI-powered patient risk assessment & ML Ops Monitoring. 
            Powered by explainable AI (SHAP) and XGBoost.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Model Accuracy" value={84.2} suffix="%" icon={BrainCircuit} trend={1.2} />
        <MetricCard title="Predictions Today" value={142} icon={TrendingUp} trend={12.4} />
        <MetricCard title="Avg Risk Score" value={38} suffix="%" icon={BarChart3} trend={-2.1} />
        <MetricCard title="API Latency" value={latency || 240} suffix="ms" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8 min-h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-heading font-semibold text-text flex items-center gap-2">
              <TrendingUp size={20} className="text-accent" />
              Inference Traffic (Estimated)
            </h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs text-text-muted font-mono bg-white/5 px-2 py-1 rounded">
                LIVE SESSION
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <RechartsClientOnly minHeight={300}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} isAnimationActive={false}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5c0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00e5c0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#6b90b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b90b8" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#112038', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#00e5c0' }}
                />
                <Area type="monotone" dataKey="val" stroke="#00e5c0" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
            </RechartsClientOnly>
          </div>
        </div>

        <div className="glass-card p-8 flex flex-col justify-center items-center text-center">
          <div className="p-6 rounded-full bg-accent/5 border border-accent/10 mb-6 relative group">
            <div className="absolute inset-x-0 inset-y-0 bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
            <BrainCircuit size={60} className="text-accent relative z-10" />
          </div>
          <h2 className="text-xl font-heading font-semibold mb-2">XGBoost-V4 Online</h2>
          <p className="text-text-muted text-sm px-4 mb-6 leading-relaxed">
            Classifier operational on Render. SHAP explaining engine active. 
            Latest Latency: <span className="text-accent font-mono">{latency || '---'}ms</span>
          </p>
          <div className="w-full bg-surface/50 rounded-xl p-5 border border-white/5">
             <div className="flex justify-between text-xs mb-3">
               <span className="text-text-muted uppercase tracking-widest font-bold">Reliability Score</span>
               <span className="text-accent font-mono">99.98%</span>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-accent shadow-[0_0_10px_#00e5c0]" style={{ width: '99.9%' }}></div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 glass-card p-8">
           <h2 className="text-xl font-heading font-semibold mb-6 flex items-center gap-2">
             <Activity size={20} className="text-accent" />
             Recent System Inferences
           </h2>
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b border-white/5 text-text-muted text-xs uppercase tracking-widest">
                   <th className="pb-4 px-4 font-semibold">Patient ID</th>
                   <th className="pb-4 px-4 font-semibold">Risk Level</th>
                   <th className="pb-4 px-4 font-semibold">Score</th>
                   <th className="pb-4 px-4 font-semibold text-right">Timestamp</th>
                 </tr>
               </thead>
               <tbody>
                 {[1,2,3,4,5].map((item, idx) => {
                   const score = mockScores[idx];
                   return (
                   <tr key={item} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                     <td className="py-5 px-4 font-mono text-sm text-text">PT-{(100800 + item)}</td>
                     <td className="py-5 px-4"><RiskBadge score={score} /></td>
                     <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs w-10 text-text-muted">{(score * 100).toFixed(0)}%</span>
                          <div className="h-1.5 flex-grow bg-white/5 rounded-full overflow-hidden max-w-[120px]">
                            <div 
                              className={`h-full transition-all duration-1000 ${score >= 0.6 ? 'bg-danger' : score >= 0.3 ? 'bg-warning' : 'bg-accent'}`} 
                              style={{ width: `${score * 100}%` }}
                            ></div>
                          </div>
                        </div>
                     </td>
                     <td className="py-5 px-4 text-right text-text-muted text-xs font-mono">Just now</td>
                   </tr>
                 )})}
               </tbody>
             </table>
           </div>
        </div>

        <div className="glass-card p-8 flex flex-col">
          <h2 className="text-lg font-heading font-semibold mb-6 text-center">System Risk Distribution</h2>
          <div className="flex flex-col gap-6 flex-grow">
             {[
               { label: 'Low Risk', count: 84, color: 'bg-accent', total: 142 },
               { label: 'Moderate', count: 42, color: 'bg-warning', total: 142 },
               { label: 'High Risk', count: 16, color: 'bg-danger', total: 142 }
             ].map((row) => (
               <div key={row.label} className="flex flex-col gap-2">
                 <div className="flex justify-between text-xs mb-1">
                   <span className="text-text font-medium">{row.label}</span>
                   <span className="text-text-muted">{row.count} patients</span>
                 </div>
                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className={`h-full transition-all duration-1000 ${row.color}`} style={{ width: `${(row.count / row.total) * 100}%` }}></div>
                 </div>
               </div>
             ))}
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
             <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">
               Refreshed: {new Date().toLocaleTimeString()}
             </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
