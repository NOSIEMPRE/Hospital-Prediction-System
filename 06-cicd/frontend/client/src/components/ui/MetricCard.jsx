import React from 'react';
import * as Lucide from 'lucide-react';

const Activity = Lucide.Activity;

export default function MetricCard({ title, value, icon: Icon, trend, prefix = '', suffix = '', decimals = 0 }) {
  // Ultra-safe icon checking
  const SafeIcon = (Icon && typeof Icon === 'function') ? Icon : Activity;

  return (
    <div className="glass-card glass-hover p-6 group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-surface/80 text-accent group-hover:bg-accent/10 transition-colors border border-white/5">
          <SafeIcon size={24} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <h3 className="text-text-muted text-sm font-medium tracking-wide">{title}</h3>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold font-mono text-text">
          {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : value}{suffix}
        </span>
      </div>
    </div>
  );
}
