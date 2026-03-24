import React, { useState, useMemo } from 'react';
import { Bell, BellOff, CheckCheck, Trash2, X, AlertTriangle, CheckCircle2, Info, ShieldAlert, Search, Download, Filter } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import GlowButton from '../components/ui/GlowButton';
import useAppStore from '../store/appStore';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  alert: { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Alert' },
  success: { icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10', label: 'Success' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Warning' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Info' },
};

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function groupByDate(notifications) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const groups = { Today: [], Yesterday: [], Older: [] };
  notifications.forEach(n => {
    const date = new Date(n.timestamp).toDateString();
    if (date === today) groups.Today.push(n);
    else if (date === yesterday) groups.Yesterday.push(n);
    else groups.Older.push(n);
  });
  return groups;
}

export default function NotificationCenter() {
  const { notifications, markRead, markAllRead, clearNotification, clearAll } = useAppStore();
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (filterType !== 'all' && n.type !== filterType) return false;
      if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [notifications, filterType, filterPriority, searchQuery]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const groups = groupByDate(filtered);

  // Stats
  const stats = useMemo(() => ({
    total: notifications.length,
    unread: unreadCount,
    alerts: notifications.filter(n => n.type === 'alert').length,
    highPriority: notifications.filter(n => n.priority === 'high').length,
  }), [notifications, unreadCount]);

  const exportNotifications = () => {
    if (notifications.length === 0) {
      toast.error('No notifications to export');
      return;
    }
    const data = notifications.map(n => ({
      timestamp: n.timestamp,
      type: n.type,
      priority: n.priority,
      title: n.title,
      message: n.message,
      read: n.read,
    }));
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Notifications exported as CSV');
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2 text-glow">Notification Center</h1>
            <p className="text-text-muted">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
          <div className="flex gap-3">
            <GlowButton variant="secondary" onClick={exportNotifications} className="text-xs px-4 py-2">
              <Download size={14} className="mr-2" /> Export
            </GlowButton>
            <GlowButton variant="secondary" onClick={markAllRead} className="text-xs px-4 py-2">
              <CheckCheck size={14} className="mr-2" /> Mark All Read
            </GlowButton>
            <GlowButton variant="secondary" onClick={clearAll} className="text-xs px-4 py-2">
              <Trash2 size={14} className="mr-2" /> Clear All
            </GlowButton>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-text' },
            { label: 'Unread', value: stats.unread, color: 'text-accent' },
            { label: 'Alerts', value: stats.alerts, color: 'text-red-400' },
            { label: 'High Priority', value: stats.highPriority, color: 'text-yellow-400' },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <p className={`text-2xl font-heading font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="w-full bg-surface/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-text focus:border-accent outline-none transition-all placeholder:text-text-muted/50"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-6 mb-8">
          <div className="flex gap-2 items-center">
            <Filter size={12} className="text-text-muted" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1">Type</span>
            {['all', 'alert', 'success', 'warning', 'info'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterType === type
                    ? 'bg-accent/10 text-accent border border-accent/30'
                    : 'bg-surface/50 text-text-muted border border-white/5 hover:border-accent/20'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1">Priority</span>
            {['all', 'high', 'medium', 'low'].map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterPriority === p
                    ? 'bg-accent/10 text-accent border border-accent/30'
                    : 'bg-surface/50 text-text-muted border border-white/5 hover:border-accent/20'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Groups */}
        {filtered.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <BellOff size={48} className="text-text-muted mx-auto mb-4 opacity-30" />
            <p className="text-text-muted text-lg font-heading">
              {searchQuery ? 'No matching notifications' : 'No notifications'}
            </p>
            <p className="text-text-muted text-sm mt-2">
              {searchQuery
                ? 'Try a different search term or clear your filters.'
                : 'Alerts from predictions, batch jobs, and system events will appear here.'}
            </p>
          </div>
        ) : (
          Object.entries(groups).map(([label, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={label} className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</h3>
                  <span className="text-[10px] text-text-muted/50 font-mono">{items.length}</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="space-y-2">
                  {items.map(n => {
                    const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                    const Icon = config.icon;
                    return (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`glass-card p-4 flex items-start gap-4 cursor-pointer transition-all hover:bg-white/[0.03] group ${
                          !n.read ? 'border-l-4 border-l-accent' : 'opacity-70'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                          <Icon size={18} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-sm font-semibold ${!n.read ? 'text-text' : 'text-text-muted'}`}>{n.title}</h4>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${config.bg} ${config.color}`}>
                                {config.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-text-muted flex-shrink-0 ml-4 font-mono">{timeAgo(n.timestamp)}</span>
                          </div>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">{n.message}</p>
                          {n.priority === 'high' && (
                            <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-widest text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
                              High Priority
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); clearNotification(n.id); }}
                          className="p-1 rounded text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </PageTransition>
  );
}
