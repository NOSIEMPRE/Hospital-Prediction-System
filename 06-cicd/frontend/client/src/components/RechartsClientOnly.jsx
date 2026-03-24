import { useState, useEffect } from 'react';

/**
 * Recharts' ResponsiveContainer + React 19 can throw NotFoundError (removeChild)
 * when the tree mounts/unmounts quickly (e.g. StrictMode or route transitions).
 * Mount charts only after the browser commit phase.
 */
export default function RechartsClientOnly({ children, minHeight = 300, className = '' }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) {
    return <div className={`w-full ${className}`} style={{ minHeight }} aria-hidden />;
  }
  return children;
}
