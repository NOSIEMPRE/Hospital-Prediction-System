// Helper for mapping Risk Scores to proper colors and UI labels
export const getRiskInfo = (score) => {
  if (score == null || isNaN(score)) return { label: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-400', hex: '#9ca3af' };
  
  // Exact mapping logic to match the UI expectations
  if (score >= 0.60) {
    return { label: 'High', color: 'text-danger', bg: 'bg-danger', hex: '#ef4444' };
  }
  if (score >= 0.30) {
    return { label: 'Moderate', color: 'text-warning', bg: 'bg-warning', hex: '#f59e0b' };
  }
  return { label: 'Low', color: 'text-accent', bg: 'bg-accent', hex: '#00e5c0' };
};
