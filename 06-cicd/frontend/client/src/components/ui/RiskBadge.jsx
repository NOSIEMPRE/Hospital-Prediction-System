import React from 'react';
import { getRiskInfo } from '../../utils/riskHelpers';

export default function RiskBadge({ score, label, showPulse = false, className = '' }) {
  const info = getRiskInfo(score);
  const displayLabel = label || info.label;

  return (
    <div className={`relative inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${info.bg} bg-opacity-15 ${info.color} border border-current border-opacity-30 ${className}`}>
      {showPulse && score >= 0.60 && (
        <span className="absolute -inset-1 rounded-full animate-ping opacity-25" style={{ backgroundColor: info.hex }}></span>
      )}
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: info.hex }}></span>
      {displayLabel}
    </div>
  );
}
