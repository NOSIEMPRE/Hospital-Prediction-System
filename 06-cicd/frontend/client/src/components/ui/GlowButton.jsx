import React from 'react';

export default function GlowButton({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) {
  const isPrimary = variant === 'primary';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2
        transition-all duration-300 active:scale-[0.98] hover:scale-[1.02]
        ${disabled ? 'opacity-50 cursor-not-allowed bg-surface text-text-muted border border-white/10'
                   : isPrimary ? 'bg-accent/10 border border-accent/50 text-accent box-glow hover:bg-accent/20'
                               : 'bg-surface border border-white/10 text-text hover:bg-elevated hover:border-white/20'}
        ${className}
      `}
    >
      {isPrimary && !disabled && (
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 -translate-x-full hover:animate-[shimmer_1.5s_infinite]" />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
