import React from 'react';

/** Plain wrapper — framer-motion + React 19 caused NotFoundError removeChild crashes. */
export default function PageTransition({ children, className = '' }) {
  return (
    <div className={`flex-1 overflow-x-hidden ${className}`}>
      {children}
    </div>
  );
}
