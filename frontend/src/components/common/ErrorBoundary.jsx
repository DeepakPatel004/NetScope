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
        <div className="min-h-screen bg-[#101214] text-slate-100 p-6 flex items-center justify-center">
          <div className="max-w-md w-full bg-[#181b1f] border border-[#2b3036] rounded-xl p-8 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-xl flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>

            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wide">
                UI Telemetry Exception
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">
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
                className="flex items-center gap-2 bg-[#2b3036] hover:bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition"
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
