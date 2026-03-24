import React, { useState } from 'react';
import { Globe, Bell, UserCog, LayoutDashboard, Save, Clock, Database, Download, Volume2, VolumeX, Moon, Sun } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import GlowButton from '../components/ui/GlowButton';
import useAppStore from '../store/appStore';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'api', label: 'API Configuration', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: UserCog },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shift', label: 'Shift & Schedule', icon: Clock },
  { id: 'data', label: 'Data & Export', icon: Database },
];

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-accent' : 'bg-surface border border-white/20'
      }`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
        enabled ? 'translate-x-6' : 'translate-x-0.5'
      }`} />
    </button>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface/30 rounded-xl border border-white/5">
      <div>
        <p className="text-sm font-semibold text-text">{label}</p>
        {desc && <p className="text-xs text-text-muted mt-1">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ label }) {
  return <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</h3>;
}

export default function Settings() {
  const { settings: rawSettings, updateSettings, currentUser, notifications } = useAppStore();
  const [activeTab, setActiveTab] = useState('api');

  // Defensive defaults for settings sections that may not exist in persisted state
  const settings = {
    ...rawSettings,
    shift: rawSettings.shift || { shiftType: 'day', autoStatusEnabled: true, maxPatientsPerShift: 25, handoffReminder: true },
    data: rawSettings.data || { predictionRetention: 90, autoExportEnabled: false, exportFormat: 'csv', auditLogEnabled: true },
    notifications: { soundEnabled: true, emailDigest: false, quietHoursEnabled: false, quietHoursStart: '22:00', quietHoursEnd: '07:00', ...rawSettings.notifications },
  };

  const handleSave = (section) => {
    toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`);
  };

  const exportNotifications = () => {
    const data = notifications.map(n => ({
      timestamp: n.timestamp,
      type: n.type,
      priority: n.priority,
      title: n.title,
      message: n.message,
      read: n.read,
    }));
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Notifications exported');
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-heading font-bold mb-2 text-glow">Settings</h1>
        <p className="text-text-muted mb-10">Configure your platform preferences</p>

        <div className="flex gap-8">
          {/* Tab Navigation */}
          <div className="w-56 flex-shrink-0">
            <div className="glass-card p-3 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-accent/10 text-accent border-l-4 border-accent'
                      : 'text-text-muted hover:bg-surface hover:text-text'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Doctor Quick Switch */}
            <div className="glass-card p-4 mt-4">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Current Doctor</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent font-heading font-bold text-xs">
                  {currentUser?.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-accent truncate">{currentUser?.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            {activeTab === 'api' && (
              <div className="glass-card p-8">
                <h2 className="text-xl font-heading font-bold mb-2">API Configuration</h2>
                <p className="text-text-muted text-sm mb-8">Configure how the platform connects to the ML inference API.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Endpoint Mode</label>
                    <div className="flex gap-3">
                      {['local', 'cloud', 'custom'].map(mode => (
                        <button
                          key={mode}
                          onClick={() => updateSettings('api', { endpoint: mode })}
                          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                            settings.api.endpoint === mode
                              ? 'bg-accent/10 border-accent text-accent'
                              : 'bg-surface/50 border-white/10 text-text-muted hover:border-accent/30'
                          }`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {settings.api.endpoint === 'custom' && (
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Custom API URL</label>
                      <input
                        type="text"
                        value={settings.api.customUrl}
                        onChange={(e) => updateSettings('api', { customUrl: e.target.value })}
                        placeholder="https://your-api.example.com"
                        className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 text-text focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">
                      <span>Request Timeout</span>
                      <span className="text-accent font-mono">{(settings.api.timeout / 1000).toFixed(0)}s</span>
                    </div>
                    <input
                      type="range"
                      min="10000"
                      max="300000"
                      step="5000"
                      value={settings.api.timeout}
                      onChange={(e) => updateSettings('api', { timeout: parseInt(e.target.value) })}
                      className="w-full accent-accent h-2 bg-base rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted mt-1">
                      <span>10s</span><span>300s</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <GlowButton variant="primary" onClick={() => handleSave('api')}>
                    <Save size={16} className="mr-2" /> Save API Settings
                  </GlowButton>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="glass-card p-8">
                <h2 className="text-xl font-heading font-bold mb-2">Notification Preferences</h2>
                <p className="text-text-muted text-sm mb-8">Control which alerts you receive and when.</p>

                <div className="space-y-6">
                  <SectionHeader label="Alert Types" />
                  {[
                    { key: 'criticalRisk', label: 'Critical Risk Alerts', desc: 'Get notified when a patient exceeds the risk threshold' },
                    { key: 'batchComplete', label: 'Batch Processing Complete', desc: 'Alert when batch scoring jobs finish' },
                    { key: 'systemHealth', label: 'System Health Warnings', desc: 'Notify when API status degrades or goes offline' },
                  ].map(item => (
                    <SettingRow key={item.key} label={item.label} desc={item.desc}>
                      <Toggle
                        enabled={settings.notifications[item.key]}
                        onChange={() => updateSettings('notifications', { [item.key]: !settings.notifications[item.key] })}
                      />
                    </SettingRow>
                  ))}

                  <div>
                    <div className="flex justify-between text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">
                      <span>Risk Alert Threshold</span>
                      <span className="text-accent font-mono">{(settings.notifications.riskThreshold * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={settings.notifications.riskThreshold}
                      onChange={(e) => updateSettings('notifications', { riskThreshold: parseFloat(e.target.value) })}
                      className="w-full accent-accent h-2 bg-base rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted mt-1">
                      <span>10% (Sensitive)</span><span>90% (Only critical)</span>
                    </div>
                  </div>

                  <SectionHeader label="Sound & Delivery" />
                  <SettingRow label="Notification Sound" desc="Play a sound when new alerts arrive">
                    <div className="flex items-center gap-3">
                      {settings.notifications.soundEnabled ? <Volume2 size={16} className="text-accent" /> : <VolumeX size={16} className="text-text-muted" />}
                      <Toggle
                        enabled={settings.notifications.soundEnabled}
                        onChange={() => updateSettings('notifications', { soundEnabled: !settings.notifications.soundEnabled })}
                      />
                    </div>
                  </SettingRow>
                  <SettingRow label="Email Digest" desc="Receive a daily summary of notifications via email">
                    <Toggle
                      enabled={settings.notifications.emailDigest}
                      onChange={() => updateSettings('notifications', { emailDigest: !settings.notifications.emailDigest })}
                    />
                  </SettingRow>

                  <SectionHeader label="Quiet Hours" />
                  <SettingRow label="Enable Quiet Hours" desc="Suppress non-critical notifications during specified hours">
                    <Toggle
                      enabled={settings.notifications.quietHoursEnabled}
                      onChange={() => updateSettings('notifications', { quietHoursEnabled: !settings.notifications.quietHoursEnabled })}
                    />
                  </SettingRow>
                  {settings.notifications.quietHoursEnabled && (
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Start</label>
                        <input
                          type="time"
                          value={settings.notifications.quietHoursStart}
                          onChange={(e) => updateSettings('notifications', { quietHoursStart: e.target.value })}
                          className="w-full bg-base border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent outline-none font-mono"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">End</label>
                        <input
                          type="time"
                          value={settings.notifications.quietHoursEnd}
                          onChange={(e) => updateSettings('notifications', { quietHoursEnd: e.target.value })}
                          className="w-full bg-base border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <SectionHeader label="History" />
                  <div className="flex gap-3">
                    <GlowButton variant="secondary" onClick={exportNotifications} className="text-xs">
                      <Download size={14} className="mr-2" /> Export Notification History
                    </GlowButton>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <GlowButton variant="primary" onClick={() => handleSave('notifications')}>
                    <Save size={16} className="mr-2" /> Save Notification Settings
                  </GlowButton>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="glass-card p-8">
                <h2 className="text-xl font-heading font-bold mb-2">Profile Settings</h2>
                <p className="text-text-muted text-sm mb-8">Customize your doctor profile information.</p>

                <div className="space-y-6">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center text-accent font-heading font-bold text-2xl">
                      {currentUser?.initials}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-lg">{currentUser?.name}</p>
                      <p className="text-accent text-xs font-bold uppercase tracking-widest">{currentUser?.role}</p>
                      {currentUser?.education?.map((edu, i) => (
                        <p key={i} className="text-text-muted text-xs mt-1">{edu.degree} — {edu.school}</p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Display Name</label>
                    <input
                      type="text"
                      value={settings.profile.displayName || currentUser?.name || ''}
                      onChange={(e) => updateSettings('profile', { displayName: e.target.value })}
                      className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 text-text focus:border-accent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Specialty</label>
                    <input
                      type="text"
                      value={settings.profile.specialty}
                      onChange={(e) => updateSettings('profile', { specialty: e.target.value })}
                      placeholder="e.g., Internal Medicine, Endocrinology"
                      className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 text-text focus:border-accent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Bio</label>
                    <textarea
                      value={settings.profile.bio || currentUser?.bio || ''}
                      onChange={(e) => updateSettings('profile', { bio: e.target.value })}
                      rows={3}
                      className="w-full bg-base border border-white/10 rounded-xl px-5 py-3.5 text-text focus:border-accent outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <GlowButton variant="primary" onClick={() => handleSave('profile')}>
                    <Save size={16} className="mr-2" /> Save Profile
                  </GlowButton>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="glass-card p-8">
                <h2 className="text-xl font-heading font-bold mb-2">Dashboard Customization</h2>
                <p className="text-text-muted text-sm mb-8">Control which widgets are visible and how often data refreshes.</p>

                <div className="space-y-6">
                  <SectionHeader label="Widget Visibility" />
                  {[
                    { key: 'showInferenceChart', label: 'Inference Traffic Chart' },
                    { key: 'showModelStatus', label: 'Model Status Card' },
                    { key: 'showRiskDistribution', label: 'Risk Distribution Sidebar' },
                  ].map(item => (
                    <SettingRow key={item.key} label={item.label}>
                      <Toggle
                        enabled={settings.dashboard[item.key]}
                        onChange={() => updateSettings('dashboard', { [item.key]: !settings.dashboard[item.key] })}
                      />
                    </SettingRow>
                  ))}

                  <div className="pt-4">
                    <div className="flex justify-between text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">
                      <span>Auto-Refresh Rate</span>
                      <span className="text-accent font-mono">{settings.dashboard.refreshRate}s</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      step="5"
                      value={settings.dashboard.refreshRate}
                      onChange={(e) => updateSettings('dashboard', { refreshRate: parseInt(e.target.value) })}
                      className="w-full accent-accent h-2 bg-base rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted mt-1">
                      <span>10s (Frequent)</span><span>120s (Battery saver)</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Theme</label>
                    <div className="flex gap-3">
                      {[{ id: 'dark', icon: Moon, label: 'Dark' }, { id: 'light', icon: Sun, label: 'Light' }].map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => updateSettings('dashboard', { theme: theme.id })}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                            settings.dashboard.theme === theme.id
                              ? 'bg-accent/10 border-accent text-accent'
                              : 'bg-surface/50 border-white/10 text-text-muted hover:border-accent/30'
                          }`}
                        >
                          <theme.icon size={14} />
                          {theme.label}
                          {theme.id === 'light' && <span className="text-[10px] opacity-50">(Coming soon)</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <GlowButton variant="primary" onClick={() => handleSave('dashboard')}>
                    <Save size={16} className="mr-2" /> Save Dashboard Settings
                  </GlowButton>
                </div>
              </div>
            )}

            {activeTab === 'shift' && (
              <div className="glass-card p-8">
                <h2 className="text-xl font-heading font-bold mb-2">Shift & Schedule</h2>
                <p className="text-text-muted text-sm mb-8">Configure your shift preferences and patient workload limits.</p>

                <div className="space-y-6">
                  <SectionHeader label="Shift Configuration" />
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Current Shift</label>
                    <div className="flex gap-3">
                      {[
                        { id: 'day', label: 'Day (7a-3p)', emoji: '☀️' },
                        { id: 'evening', label: 'Evening (3p-11p)', emoji: '🌅' },
                        { id: 'night', label: 'Night (11p-7a)', emoji: '🌙' },
                      ].map(shift => (
                        <button
                          key={shift.id}
                          onClick={() => updateSettings('shift', { shiftType: shift.id })}
                          className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all border text-center ${
                            settings.shift.shiftType === shift.id
                              ? 'bg-accent/10 border-accent text-accent'
                              : 'bg-surface/50 border-white/10 text-text-muted hover:border-accent/30'
                          }`}
                        >
                          <span className="block text-lg mb-1">{shift.emoji}</span>
                          {shift.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <SettingRow label="Auto-Status Update" desc="Automatically set your availability status based on shift schedule">
                    <Toggle
                      enabled={settings.shift.autoStatusEnabled}
                      onChange={() => updateSettings('shift', { autoStatusEnabled: !settings.shift.autoStatusEnabled })}
                    />
                  </SettingRow>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">
                      <span>Max Patients Per Shift</span>
                      <span className="text-accent font-mono">{settings.shift.maxPatientsPerShift}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="1"
                      value={settings.shift.maxPatientsPerShift}
                      onChange={(e) => updateSettings('shift', { maxPatientsPerShift: parseInt(e.target.value) })}
                      className="w-full accent-accent h-2 bg-base rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted mt-1">
                      <span>5</span><span>50</span>
                    </div>
                  </div>

                  <SettingRow label="Handoff Reminder" desc="Get reminded 30 minutes before shift end to complete handoff notes">
                    <Toggle
                      enabled={settings.shift.handoffReminder}
                      onChange={() => updateSettings('shift', { handoffReminder: !settings.shift.handoffReminder })}
                    />
                  </SettingRow>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <GlowButton variant="primary" onClick={() => handleSave('shift')}>
                    <Save size={16} className="mr-2" /> Save Shift Settings
                  </GlowButton>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="glass-card p-8">
                <h2 className="text-xl font-heading font-bold mb-2">Data & Export</h2>
                <p className="text-text-muted text-sm mb-8">Manage prediction data retention and export preferences.</p>

                <div className="space-y-6">
                  <SectionHeader label="Data Retention" />
                  <div>
                    <div className="flex justify-between text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">
                      <span>Prediction History Retention</span>
                      <span className="text-accent font-mono">{settings.data.predictionRetention} days</span>
                    </div>
                    <input
                      type="range"
                      min="7"
                      max="365"
                      step="7"
                      value={settings.data.predictionRetention}
                      onChange={(e) => updateSettings('data', { predictionRetention: parseInt(e.target.value) })}
                      className="w-full accent-accent h-2 bg-base rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted mt-1">
                      <span>7 days</span><span>365 days</span>
                    </div>
                  </div>

                  <SectionHeader label="Export Settings" />
                  <SettingRow label="Auto-Export Predictions" desc="Automatically export predictions at the end of each shift">
                    <Toggle
                      enabled={settings.data.autoExportEnabled}
                      onChange={() => updateSettings('data', { autoExportEnabled: !settings.data.autoExportEnabled })}
                    />
                  </SettingRow>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Export Format</label>
                    <div className="flex gap-3">
                      {['csv', 'json', 'xlsx'].map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => updateSettings('data', { exportFormat: fmt })}
                          className={`px-5 py-2.5 rounded-lg text-sm font-mono font-medium transition-all border ${
                            settings.data.exportFormat === fmt
                              ? 'bg-accent/10 border-accent text-accent'
                              : 'bg-surface/50 border-white/10 text-text-muted hover:border-accent/30'
                          }`}
                        >
                          .{fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <SectionHeader label="Audit" />
                  <SettingRow label="Audit Logging" desc="Log all prediction requests and results for compliance">
                    <Toggle
                      enabled={settings.data.auditLogEnabled}
                      onChange={() => updateSettings('data', { auditLogEnabled: !settings.data.auditLogEnabled })}
                    />
                  </SettingRow>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <GlowButton variant="primary" onClick={() => handleSave('data')}>
                    <Save size={16} className="mr-2" /> Save Data Settings
                  </GlowButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
