import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import Dashboard from './pages/Dashboard';
import Intake from './pages/Intake';
import Batch from './pages/Batch';
import Monitoring from './pages/Monitoring';
import Login from './pages/Login';
import useAppStore from './store/appStore';

export default function App() {
  const { currentUser } = useAppStore();

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
