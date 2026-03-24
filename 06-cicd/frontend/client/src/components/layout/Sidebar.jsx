import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, LayoutDashboard, FileUp, ShieldAlert, ChevronLeft, ChevronRight, Server } from 'lucide-react';
import useAppStore from '../../store/appStore';

const NavItem = ({ to, icon: Icon, label, isExpanded }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center px-4 py-3 mx-2 mb-2 rounded-lg transition-all duration-300
      ${isActive ? 'bg-elevated border-l-4 border-accent text-accent' : 'text-text-muted hover:bg-surface hover:text-text'}
    `}
  >
    <Icon size={24} className="min-w-6" />
    {isExpanded && (
      <span className="ml-4 font-medium whitespace-nowrap transition-opacity duration-200">
        {label}
      </span>
    )}
  </NavLink>
);

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar, apiHealth } = useAppStore();

  return (
    <aside
      style={{ width: isSidebarOpen ? 260 : 80 }}
      className="glass-card m-4 flex flex-col justify-between py-6 rounded-2xl border-white/5 relative z-40 lg:flex-shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden"
    >
      <div>
        <div className="flex items-center px-6 mb-10 h-10">
          <div className="relative">
            <Activity className="text-accent absolute -inset-1 blur-sm opacity-50 pulse-anim" size={28} />
            <Activity className="text-accent relative z-10" size={28} />
          </div>
          {isSidebarOpen && (
            <h1 className="ml-4 font-heading font-bold text-lg leading-tight transition-opacity duration-200">
              HospitalRisk<br/><span className="text-accent text-sm font-normal">Platform</span>
            </h1>
          )}
        </div>

        <nav>
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" isExpanded={isSidebarOpen} />
          <NavItem to="/intake" icon={Activity} label="Patient Intake" isExpanded={isSidebarOpen} />
          <NavItem to="/batch" icon={FileUp} label="Batch Processing" isExpanded={isSidebarOpen} />
          <NavItem to="/monitoring" icon={ShieldAlert} label="Monitoring" isExpanded={isSidebarOpen} />
        </nav>
      </div>

      <div className="px-4">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg text-text-muted hover:bg-surface hover:text-text transition-colors mb-4"
        >
          {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        
        <div className={`flex items-center justify-center p-3 rounded-xl bg-surface/50 border border-white/5 ${isSidebarOpen ? 'px-4 justify-start' : ''}`}>
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${apiHealth.status === 'ok' ? 'bg-accent' : apiHealth.status === 'unknown' ? 'bg-yellow-400' : 'bg-danger'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${apiHealth.status === 'ok' ? 'bg-accent' : apiHealth.status === 'unknown' ? 'bg-yellow-400' : 'bg-danger'}`}></span>
          </div>
          {isSidebarOpen && (
             <div className="ml-3 text-xs">
               <p className="font-semibold text-text">API Status</p>
               <p className="text-text-muted font-mono">{apiHealth.status === 'ok' ? 'Connected' : apiHealth.status === 'unknown' ? 'Checking...' : 'Degraded'}</p>
             </div>
          )}
        </div>
      </div>
    </aside>
  );
}
