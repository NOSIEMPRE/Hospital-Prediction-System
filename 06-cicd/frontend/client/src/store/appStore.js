import { create } from 'zustand';

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

const useAppStore = create((set) => ({
  currentUser: DOCTORS[0], // Default logged-in user
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
}));

export default useAppStore;
