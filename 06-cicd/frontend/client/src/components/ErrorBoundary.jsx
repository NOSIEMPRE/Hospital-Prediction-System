import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base flex items-center justify-center p-8 text-center font-body">
          <div className="glass-card p-12 border-danger/30">
            <h1 className="text-3xl font-bold text-danger mb-4">Application Error</h1>
            <p className="text-text-muted mb-6">A critical error occurred while rendering the interface.</p>
            <pre className="bg-surface p-4 rounded-lg text-xs text-danger text-left overflow-auto max-w-lg mb-8">
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-elevated border border-white/10 px-6 py-2 rounded-full text-text hover:bg-surface transition-colors"
            >
              Reload System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
