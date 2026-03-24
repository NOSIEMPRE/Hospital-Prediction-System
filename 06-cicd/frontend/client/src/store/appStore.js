import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DOCTORS = [
  {
    id: 1,
    name: 'Dr. Ortiz Togashi',
    initials: 'DOT',
    role: 'Chief Health Informatics Officer',
    education: [
      { degree: 'M.D. & B.S.', school: 'Johns Hopkins University' },
      { degree: 'M.S. Health Data Science', school: 'Harvard University' }
    ],
    bio: 'Pioneer in AI-driven diagnostic platforms, bridging clinical expertise with ML.',
    isElite: true
  },
  {
    id: 2,
    name: 'Dr. Yaxin Wu',
    initials: 'DYW',
    role: 'Director of Predictive Medicine',
    education: [
      { degree: 'M.D. & Ph.D. Biomed Informatics', school: 'Stanford University' },
      { degree: 'B.S. Biology', school: 'Tsinghua University' }
    ],
    bio: 'Specialist in high-dimensional genomic modeling and medical AI excellence.',
    isElite: true
  }
];

const DEFAULT_SETTINGS = {
  api: {
    endpoint: 'local',
    customUrl: '',
    timeout: 130000,
  },
  notifications: {
    criticalRisk: true,
    batchComplete: true,
    systemHealth: true,
    riskThreshold: 0.6,
    soundEnabled: true,
    emailDigest: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  },
  profile: {
    displayName: '',
    specialty: '',
    bio: '',
  },
  dashboard: {
    showInferenceChart: true,
    showModelStatus: true,
    showRiskDistribution: true,
    refreshRate: 30,
    theme: 'dark',
  },
  shift: {
    shiftType: 'day',
    autoStatusEnabled: true,
    maxPatientsPerShift: 25,
    handoffReminder: true,
  },
  data: {
    predictionRetention: 90,
    autoExportEnabled: false,
    exportFormat: 'csv',
    auditLogEnabled: true,
  },
};

const useAppStore = create(
  persist(
    (set, get) => ({
      currentUser: DOCTORS[0],
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      apiHealth: { status: 'unknown', latency_ms: 0, model_loaded: false },
      setApiHealth: (health) => set({ apiHealth: health }),

      recentPredictions: [],
      addPrediction: (pred) => set((state) => ({
        recentPredictions: [pred, ...state.recentPredictions].slice(0, 10)
      })),

      login: (id) => set({ currentUser: DOCTORS.find(d => d.id === id) }),
      logout: () => set({ currentUser: null }),

      // ── Settings ────────────────────────────────────────────────────────
      settings: { ...DEFAULT_SETTINGS },
      updateSettings: (section, values) => set((state) => ({
        settings: {
          ...state.settings,
          [section]: { ...state.settings[section], ...values }
        }
      })),

      // ── Notifications ───────────────────────────────────────────────────
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification,
          },
          ...state.notifications
        ].slice(0, 100)
      })),
      markRead: (id) => set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        )
      })),
      markAllRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),
      clearNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: 'hospital-risk-storage',
      partialize: (state) => ({
        settings: state.settings,
        notifications: state.notifications,
        recentPredictions: state.recentPredictions,
      }),
      merge: (persisted, current) => {
        const merged = { ...current, ...persisted };
        // Deep-merge settings so new sections (shift, data) get defaults
        if (persisted?.settings) {
          merged.settings = { ...DEFAULT_SETTINGS };
          for (const key of Object.keys(DEFAULT_SETTINGS)) {
            merged.settings[key] = { ...DEFAULT_SETTINGS[key], ...(persisted.settings[key] || {}) };
          }
        }
        return merged;
      },
    }
  )
);

export default useAppStore;
