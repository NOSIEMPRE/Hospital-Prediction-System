import React, { useEffect, useState, useRef } from 'react';
import { Bell, Search, User, LogOut, Settings, Award, BookOpen, GraduationCap } from 'lucide-react';
import useAppStore from '../../store/appStore';

const NOTIFICATIONS = [
  { id: 1, type: 'alert', title: 'Critical Risk Alert', message: 'Patient #8842 (Ward 4) risk surged to 89%.', time: '2m ago' },
  { id: 2, type: 'success', title: 'Batch Complete', message: 'Genomic data sync for 250 patients finished.', time: '15m ago' },
  { id: 3, type: 'warning', title: 'Medication Update', message: 'Insulin adjustments needed for ICU patients.', time: '1h ago' },
];

export default function TopBar() {
  const { currentUser, logout } = useAppStore();
  const [time, setTime] = useState(new Date());
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!currentUser) return null;

  return (
    <header className="h-20 flex items-center justify-between px-8 z-50 relative">
      <div>
        <h2 className="text-2xl font-heading font-bold text-text">Welcome back, {currentUser.name}</h2>
        <p className="text-text-muted text-sm mt-1">
          {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — {time.toLocaleTimeString()}
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search patient ID..." 
            className="bg-surface/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all w-64"
          />
        </div>
        
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className={`relative p-2 rounded-full transition-colors ${showNotifs ? 'bg-accent/10 text-accent' : 'hover:bg-surface text-text-muted hover:text-text'}`}
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-base animate-pulse"></span>
          </button>

          {showNotifs && (
              <div className="absolute right-0 mt-3 w-80 glass-card p-4 shadow-2xl border border-white/10 z-[100]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-heading font-bold text-sm">Clinical Alerts</h3>
                  <span className="text-[10px] text-accent uppercase tracking-wider font-bold">3 New</span>
                </div>
                <div className="space-y-3">
                  {NOTIFICATIONS.map(n => (
                    <div key={n.id} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-accent/20 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-bold uppercase ${n.type === 'alert' ? 'text-red-400' : n.type === 'warning' ? 'text-yellow-400' : 'text-accent'}`}>
                          {n.title}
                        </span>
                        <span className="text-[9px] text-text-muted">{n.time}</span>
                      </div>
                      <p className="text-xs text-text-muted group-hover:text-text transition-colors leading-tight">{n.message}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 text-[10px] text-text-muted hover:text-accent font-bold uppercase tracking-widest border-t border-white/5 transition-colors">
                  View All Activity
                </button>
              </div>
            )}
        </div>

        {/* Profile Avatar & Bio */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className={`h-10 w-10 rounded-full bg-surface border transition-all flex items-center justify-center font-bold font-heading overflow-hidden ${showProfile ? 'border-accent ring-4 ring-accent/10 scale-110 shadow-glow' : 'border-white/10 border-accent/30 hover:border-accent'}`}
          >
            {currentUser.initials}
          </button>

          {showProfile && (
              <div className="absolute right-0 mt-3 w-72 glass-card overflow-hidden shadow-2xl border border-white/10 z-[100]">
                <div className="bg-accent/10 p-6 text-center border-b border-white/5">
                  <div className="w-16 h-16 bg-accent/20 rounded-full mx-auto mb-3 border border-accent/30 flex items-center justify-center">
                    <User size={32} className="text-accent" />
                  </div>
                  <h3 className="font-heading font-bold text-lg leading-tight">{currentUser.name}</h3>
                  <p className="text-accent text-xs font-bold uppercase tracking-widest mt-1">{currentUser.role}</p>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    {currentUser.education.map((edu, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-text-muted">
                        {idx === 0 ? <GraduationCap size={16} className="text-accent" /> : <Award size={16} className="text-accent" />}
                        <span className="text-xs">{edu.degree} — <b className="text-text">{edu.school}</b></span>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 text-text-muted">
                      <BookOpen size={16} className="text-accent" />
                      <span className="text-[11px] leading-relaxed italic">
                        &quot;{currentUser.bio}&quot;
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 flex flex-col gap-2 border-t border-white/5">
                    <button className="flex items-center gap-3 text-xs text-text-muted hover:text-text transition-colors p-2 rounded hover:bg-white/5">
                      <Settings size={14} /> Account Settings
                    </button>
                    <button 
                      onClick={logout}
                      className="flex items-center gap-3 text-xs text-red-400 hover:text-red-300 transition-colors p-2 rounded hover:bg-red-400/5 w-full text-left"
                    >
                      <LogOut size={14} /> System Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </header>
  );
}
