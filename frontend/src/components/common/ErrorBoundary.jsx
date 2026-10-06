import React from 'react';
import { AlertCircle, RefreshCw, LayoutDashboard } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-6 flex items-center justify-center">
          <div className="max-w-md w-full bg-[#ffffff] border border-[#e2e8f0] rounded-xl p-8 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-rose-500/15 text-rose-700 border border-rose-500/30 rounded-xl flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                UI Telemetry Exception
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-sans">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex items-center gap-2 bg-[#0d9488] hover:bg-[#0f766e] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm  cursor-pointer"
              >
                <RefreshCw size={14} />
                Reload Page
              </button>
              <a
                href="/dashboard"
                className="flex items-center gap-2 bg-[#e2e8f0] hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                <LayoutDashboard size={14} />
                Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
