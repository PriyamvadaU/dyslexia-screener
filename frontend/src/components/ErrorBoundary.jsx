import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF6EE] text-[#2D2A26] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-zinc-800 p-8 rounded-3xl shadow-2xl border border-amber-300 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              An unexpected display issue occurred. You can reload the page or return to the home screen.
            </p>
            {this.state.error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-xl text-left font-mono text-[11px] text-red-700 dark:text-red-300 overflow-x-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="px-5 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold hover:bg-zinc-100 flex items-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
