import React, { useEffect, useState, useCallback } from 'react';
import { dashboardService } from '../services/dashboard.service.js';
import { Activity, Server, CheckCircle2, XCircle, RefreshCw, AlertCircle, Clock, FileText, FileDown } from 'lucide-react';
import DeviceTable from '../components/DeviceTable.jsx';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const data = await dashboardService.getSummary();
      setSummary(data.data);
    } catch (err) {
      console.error("Failed to fetch dashboard summary", err);
      setError("Failed to sync system metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = async () => {
    try {
      const blob = await dashboardService.downloadReportCsv();
      downloadBlob(blob, 'netscope-report.csv');
    } catch (err) {
      console.error('Failed to download CSV report', err);
      alert('Unable to download CSV report.');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await dashboardService.downloadReportPdf();
      downloadBlob(blob, 'netscope-report.pdf');
    } catch (err) {
      console.error('Failed to download PDF report', err);
      alert('Unable to download PDF report.');
    }
  };

  // Fetch summary metrics on mount or manual refresh trigger
  useEffect(() => {
    fetchDashboardData();
    setCountdown(30);
  }, [fetchDashboardData, refreshTrigger]);

  // Countdown timer logic for auto-refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger data refresh for both summary and table
          setRefreshTrigger((r) => r + 1);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleManualRefresh = () => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Network Overview
            </h1>
            <p className="text-sm text-slate-400 mt-1">Real-time status monitoring logs and host metrics.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-slate-400">
              <Clock size={14} className="text-indigo-400 animate-spin-slow" />
              <span>Next scan in <span className="text-indigo-400 font-bold">{countdown}s</span></span>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-400' : 'text-slate-400'} />
              Sync Data
            </button>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              <FileText size={14} className="text-slate-400" />
              Export CSV
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              <FileDown size={14} className="text-white" />
              Export PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Devices */}
          <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-2xl p-6 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Devices</span>
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Server size={18} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-100">
              {loading && !summary ? (
                <span className="text-lg font-medium text-slate-500">Syncing...</span>
              ) : (
                summary?.totalDevices || 0
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-2">Active targets in catalog</div>
          </div>

          {/* Online Devices */}
          <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-850 hover:border-slate-850 rounded-2xl p-6 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Online / UP</span>
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">
              {loading && !summary ? (
                <span className="text-lg font-medium text-slate-500">Syncing...</span>
              ) : (
                summary?.online || 0
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-2">Responding normally</div>
          </div>

          {/* Offline Devices */}
          <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-850 hover:border-slate-850 rounded-2xl p-6 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Offline / DOWN</span>
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                <XCircle size={18} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-rose-500">
              {loading && !summary ? (
                <span className="text-lg font-medium text-slate-500">Syncing...</span>
              ) : (
                summary?.offline || 0
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-2">Failing connection tests</div>
          </div>

          {/* Average Latency */}
          <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-850 hover:border-slate-850 rounded-2xl p-6 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg Latency</span>
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                <Activity size={18} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-100">
              {loading && !summary ? (
                <span className="text-lg font-medium text-slate-500">Syncing...</span>
              ) : (
                `${summary?.averageLatency || 0} ms`
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-2">Mean responsiveness index</div>
          </div>
        </div>

        {/* Devices list component, connected with the refresh trigger */}
        <DeviceTable refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}