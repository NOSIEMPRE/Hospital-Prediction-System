import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

// StrictMode disabled: Recharts + React 19 triggers removeChild crashes under dev double-mount.
createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#112038', color: '#f0f6ff', border: '1px solid rgba(255,255,255,0.1)' },
        }}
      />
    </BrowserRouter>
  </ErrorBoundary>
);
