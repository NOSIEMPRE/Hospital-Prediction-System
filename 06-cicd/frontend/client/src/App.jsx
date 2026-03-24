import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import Dashboard from './pages/Dashboard';
import Intake from './pages/Intake';
import Batch from './pages/Batch';
import Monitoring from './pages/Monitoring';
import Login from './pages/Login';
import useAppStore from './store/appStore';
import api from './api/client';

export default function App() {
  const { currentUser, setApiHealth } = useAppStore();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { data } = await api.get('/health', { timeout: 20000 });
        setApiHealth({ status: data.status, model_loaded: data.model_loaded, latency_ms: data.latency_ms });
      } catch {
        setApiHealth({ status: 'offline', model_loaded: false, latency_ms: 0 });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [setApiHealth]);

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-base text-text font-body">
      <div className="gradient-mesh"></div>
      <div className="noise-overlay"></div>

      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <TopBar />
        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/intake" element={<Intake />} />
            <Route path="/batch" element={<Batch />} />
            <Route path="/monitoring" element={<Monitoring />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
