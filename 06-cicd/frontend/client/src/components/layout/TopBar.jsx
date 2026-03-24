import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Bell, Search, User, LogOut, Settings, Award, BookOpen, GraduationCap, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/appStore';

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', keywords: ['dashboard', 'home', 'overview', 'metrics'] },
  { label: 'Patient Intake', path: '/intake', keywords: ['intake', 'patient', 'assessment', 'predict', 'new'] },
  { label: 'Batch Processing', path: '/batch', keywords: ['batch', 'csv', 'bulk', 'upload'] },
  { label: 'Monitoring', path: '/monitoring', keywords: ['monitoring', 'health', 'system', 'drift', 'latency'] },
  { label: 'Notifications', path: '/notifications', keywords: ['notifications', 'alerts', 'messages'] },
  { label: 'Settings', path: '/settings', keywords: ['settings', 'config', 'preferences', 'profile', 'api'] },
];

export default function TopBar() {
  const { currentUser, logout, notifications, markRead, markAllRead, recentPredictions } = useAppStore();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { pages: [], patients: [], notifications: [] };
    const q = searchQuery.toLowerCase();

    // Search pages
    const pages = NAV_ITEMS.filter(item =>
      item.label.toLowerCase().includes(q) || item.keywords.some(k => k.includes(q))
    );

    // Search recent predictions by patient ID
    const patients = recentPredictions.filter(p =>
      p.id?.toLowerCase().includes(q)
    );

    // Search notifications
    const matchedNotifs = notifications.filter(n =>
      n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q)
    ).slice(0, 3);

    return { pages, patients, notifications: matchedNotifs };
  }, [searchQuery, recentPredictions, notifications]);

  const hasResults = searchResults.pages.length > 0 || searchResults.patients.length > 0 || searchResults.notifications.length > 0;

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
        {/* Search */}
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search patient ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            className="bg-surface/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all w-64"
          />

          {showSearch && searchQuery.trim() && (
            <div className="absolute right-0 mt-2 w-80 glass-card p-3 shadow-2xl border border-white/10 z-[100] max-h-80 overflow-y-auto">
              {!hasResults ? (
                <p className="text-xs text-text-muted text-center py-4">No results for "{searchQuery}"</p>
              ) : (
                <>
                  {searchResults.pages.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Pages</p>
                      {searchResults.pages.map(page => (
                        <button
                          key={page.path}
                          onClick={() => { navigate(page.path); setSearchQuery(''); setShowSearch(false); }}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
                        >
                          <span className="text-sm text-text">{page.label}</span>
                          <ArrowRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.patients.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Recent Patients</p>
                      {searchResults.patients.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <Activity size={14} className={p.score >= 0.6 ? 'text-red-400' : p.score >= 0.3 ? 'text-yellow-400' : 'text-accent'} />
                            <div>
                              <span className="text-sm font-mono text-text">{p.id}</span>
                              <span className="text-xs text-text-muted ml-2">{(p.score * 100).toFixed(0)}% risk</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            p.score >= 0.6 ? 'bg-red-400/10 text-red-400' : p.score >= 0.3 ? 'bg-yellow-400/10 text-yellow-400' : 'bg-accent/10 text-accent'
                          }`}>
                            {p.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.notifications.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Notifications</p>
                      {searchResults.notifications.map(n => (
                        <button
                          key={n.id}
                          onClick={() => { navigate('/notifications'); setSearchQuery(''); setShowSearch(false); }}
                          className="w-full p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                        >
                          <p className="text-xs font-semibold text-text truncate">{n.title}</p>
                          <p className="text-[10px] text-text-muted truncate">{n.message}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className={`relative p-2 rounded-full transition-colors ${showNotifs ? 'bg-accent/10 text-accent' : 'hover:bg-surface text-text-muted hover:text-text'}`}
          >
            <Bell size={20} />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent rounded-full border-2 border-base animate-pulse flex items-center justify-center text-[9px] font-bold text-base px-1">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          {showNotifs && (
              <div className="absolute right-0 mt-3 w-80 glass-card p-4 shadow-2xl border border-white/10 z-[100]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-heading font-bold text-sm">Clinical Alerts</h3>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-accent uppercase tracking-wider font-bold hover:underline">
                      {notifications.filter(n => !n.read).length} New
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-4">No notifications yet</p>
                  ) : (
                    notifications.slice(0, 5).map(n => (
                      <div key={n.id} onClick={() => markRead(n.id)} className={`p-3 rounded-lg bg-white/5 border hover:border-accent/20 transition-all cursor-pointer group ${!n.read ? 'border-accent/20' : 'border-white/5'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] font-bold uppercase ${n.type === 'alert' ? 'text-red-400' : n.type === 'warning' ? 'text-yellow-400' : n.type === 'success' ? 'text-accent' : 'text-blue-400'}`}>
                            {n.title}
                          </span>
                          <span className="text-[9px] text-text-muted">{timeAgo(n.timestamp)}</span>
                        </div>
                        <p className="text-xs text-text-muted group-hover:text-text transition-colors leading-tight">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => { setShowNotifs(false); navigate('/notifications'); }}
                  className="w-full mt-4 py-2 text-[10px] text-text-muted hover:text-accent font-bold uppercase tracking-widest border-t border-white/5 transition-colors"
                >
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
                    <button onClick={() => { setShowProfile(false); navigate('/settings'); }} className="flex items-center gap-3 text-xs text-text-muted hover:text-text transition-colors p-2 rounded hover:bg-white/5">
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
