import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { Server, Activity, Database, Shield } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import useAppStore from '../store/appStore';

// Simulated histogram data for Recharts
const distData = [
  { range: '0-10', pts: 42 },
  { range: '10-20', pts: 65 },
  { range: '20-30', pts: 89 },
  { range: '30-40', pts: 124 },
  { range: '40-50', pts: 95 },
  { range: '50-60', pts: 72 },
  { range: '60-70', pts: 34 },
  { range: '70-80', pts: 12 },
  { range: '80-90', pts: 5 },
  { range: '90-100', pts: 2 },
];

export default function Monitoring() {
  const { apiHealth } = useAppStore();
  const [logs, setLogs] = useState(() => Array.from({length: 20}, (_, i) => ({
    time: new Date(Date.now() - (20-i)*30000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    latency: Math.floor(Math.random() * 100) + 140
  })));

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(curr => {
        const next = [...curr.slice(1), {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latency: apiHealth.latency_ms || Math.floor(Math.random() * 40) + 160
        }];
        return next;
       });
    }, 5000);
    return () => clearInterval(interval);
  }, [apiHealth.latency_ms]);

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">System Health & MLOps</h1>
            <p className="text-text-muted">Real-time status of inference nodes and model performance</p>
          </div>
          <div className="flex gap-2">
             <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
               <span className="text-xs font-bold text-accent uppercase tracking-widest">Live Node</span>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-card p-8 border-t-4 border-t-accent shadow-xl">
            <div className="flex justify-between items-center mb-6"><span className="text-text-muted text-xs font-bold uppercase tracking-widest">Inference Node</span><Server size={18} className="text-accent"/></div>
            <div className="flex items-center gap-3">
               <div className={`w-3 h-3 rounded-full ${apiHealth.status === 'ok' ? 'bg-accent' : 'bg-danger'} shadow-[0_0_15px_rgba(0,229,192,0.5)]`}></div>
               <span className="text-2xl font-bold font-heading">{apiHealth.status === 'ok' ? 'Operational' : 'Disconnected'}</span>
            </div>
            <p className="mt-3 text-[10px] text-text-muted font-mono uppercase tracking-tight bg-white/5 p-2 rounded">
              Route: {import.meta.env.VITE_API_URL ? 'Cloud Deployment' : 'Proxy (Render Cluster)'}
            </p>
          </div>

          <div className="glass-card p-8 border-t-4 border-t-purple-500 shadow-xl">
            <div className="flex justify-between items-center mb-6"><span className="text-text-muted text-xs font-bold uppercase tracking-widest">Model Weights</span><Database size={18} className="text-purple-500"/></div>
            <h3 className="text-2xl font-bold font-mono text-purple-200">XGB-4.1.2</h3>
            <p className="mt-3 text-[10px] text-text-muted uppercase tracking-widest font-bold">
               Status: <span className={apiHealth.model_loaded ? 'text-accent' : 'text-danger'}>{apiHealth.model_loaded ? 'HOT LOADED' : 'ERR: COLD'}</span>
            </p>
          </div>

          <div className="glass-card p-8 border-t-4 border-t-blue-500 shadow-xl">
            <div className="flex justify-between items-center mb-6"><span className="text-text-muted text-xs font-bold uppercase tracking-widest">Docker Runtime</span><Shield size={18} className="text-blue-500"/></div>
            <h3 className="text-2xl font-bold font-mono">14d 3h 41m</h3>
            <p className="mt-3 text-[10px] text-text-muted uppercase tracking-widest font-bold">Uptime: 99.98%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
                <Activity size={20} className="text-accent" />
                Network Latency (ms)
              </h2>
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">TRACING ENABLED</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={logs}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3d8ef8" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3d8ef8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#6b90b8" fontSize={10} minTickGap={40} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6b90b8" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0c1829', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="latency" stroke="#3d8ef8" strokeWidth={3} fillOpacity={1} fill="url(#colorLatency)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-8">
             <h2 className="text-xl font-heading font-semibold mb-8 flex items-center gap-2">
               <Activity size={20} className="text-warning" />
               Risk Score Frequency
             </h2>
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="range" stroke="#6b90b8" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis stroke="#6b90b8" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#0c1829', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Bar dataKey="pts" fill="#00e5c0" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
