import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { deviceService } from '../services/device.service.js';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Filler,
  Legend
} from 'chart.js';
import {
  ArrowLeft, Shield, Activity, Terminal, Settings,
  Trash2, Edit3, Play, AlertCircle, X, ShieldAlert
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Filler,
  Legend
);

export default function DeviceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [device, setDevice] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [sslInfo, setSslInfo] = useState(null);
  const [portsInfo, setPortsInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [checking, setChecking] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [deviceRes, analyticsRes, healthRes, sslRes, portsRes] = await Promise.all([
        api.get(`/devices/${id}`),
        api.get(`/analytics/${id}`),
        api.get(`/health/${id}`),
        api.get(`/ssl/${id}`),
        api.get(`/ports/${id}`)
      ]);

      setDevice(deviceRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setHealthHistory(healthRes.data.data);

      if (sslRes.data.data && sslRes.data.data.length > 0) {
        setSslInfo(sslRes.data.data[0]);
      } else {
        setSslInfo(null);
      }

      if (portsRes.data.data && portsRes.data.data.length > 0) {
        setPortsInfo(portsRes.data.data[0]);
      } else {
        setPortsInfo(null);
      }
    } catch (err) {
      setError("Failed to fetch device logs and configuration.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      await deviceService.triggerManualCheck(id);
      setTimeout(async () => {
        await fetchData();
        setChecking(false);
      }, 1500);
    } catch (err) {
      alert("Failed to queue health diagnostics.");
      setChecking(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deviceService.deleteDevice(id);
      navigate('/devices');
    } catch (err) {
      alert("Deletion request failed.");
      setDeleteLoading(false);
    }
  };

  if (loading && !device) {
    return (
      <div className="p-8 bg-neutral-950 min-h-screen text-neutral-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity size={24} className="animate-spin text-emerald-400" />
          <span className="text-xs font-mono text-neutral-500">POLLING DEVICE DATAGRAMS...</span>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="p-8 bg-neutral-950 min-h-screen text-neutral-100 flex items-center justify-center">
        <div className="max-w-md text-center bg-neutral-900 border border-white/5 rounded-2xl p-8">
          <AlertCircle size={32} className="text-rose-400 mx-auto mb-4" />
          <h2 className="text-sm font-bold text-neutral-200">CONNECTION LOSS</h2>
          <p className="text-xs text-neutral-400 mt-2 font-mono">{error || "DEVICE REGISTRY EMPTY"}</p>
          <Link
            to="/devices"
            className="mt-6 inline-flex items-center gap-2 bg-neutral-950 hover:bg-neutral-900 border border-white/5 text-neutral-300 px-4 py-2 rounded-xl text-xs font-mono transition-all"
          >
            <ArrowLeft size={12} /> RETURN TO CATALOG
          </Link>
        </div>
      </div>
    );
  }

  const latestLog = healthHistory[0];
  const isHealthy = latestLog ? latestLog.status === 'UP' : false;

  const logsReversed = [...healthHistory].reverse();

  const chartData = {
    labels: logsReversed.map(h => new Date(h.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        data: logsReversed.map(h => h.latency || 0),
        borderColor: '#34d399',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#34d399',
        tension: 0.4,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(52, 211, 153, 0.12)');
          gradient.addColorStop(1, 'rgba(52, 211, 153, 0)');
          return gradient;
        }
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#171717',
        titleColor: '#a3a3a3',
        bodyColor: '#e5e5e5',
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          family: 'Geist Mono, JetBrains Mono, monospace',
          size: 10
        },
        bodyFont: {
          family: 'Geist Mono, JetBrains Mono, monospace',
          size: 11
        }
      }
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false
        }
      },
      y: {
        display: false,
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="p-8 bg-neutral-950 min-h-screen text-neutral-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/devices"
              className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-white/5 text-neutral-400 hover:text-neutral-200 rounded-xl transition-all"
            >
              <ArrowLeft size={14} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-white">{device.name}</h1>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-pulse'}`} />
                  <span className={`text-[10px] font-mono tracking-widest uppercase ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isHealthy ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-1">{device.host}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to={`/devices/edit/${id}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-850 border border-white/5 text-neutral-300 px-3.5 py-2 rounded-xl text-xs font-mono transition-all"
            >
              <Edit3 size={12} />
              EDIT SETUP
            </Link>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-rose-950/20 border border-white/5 hover:border-rose-900/10 text-neutral-400 hover:text-rose-400 px-3.5 py-2 rounded-xl text-xs font-mono transition-all"
            >
              <Trash2 size={12} />
              DELETE
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Uptime Index</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {analytics ? `${analytics.uptimePercentage.toFixed(2)}%` : '0.00%'}
            </div>
          </div>

          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Avg Latency</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {analytics ? `${analytics.avgLatency} ms` : '0 ms'}
            </div>
          </div>

          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Max Latency</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {analytics ? `${analytics.maxLatency} ms` : '0 ms'}
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Latency Sweep</h3>
            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="flex items-center gap-1.5 bg-neutral-950 hover:bg-neutral-900 border border-white/5 text-neutral-300 disabled:text-neutral-600 px-3 py-1.5 rounded-xl text-xs font-mono transition-all"
            >
              <Play size={10} className="rotate-90" />
              {checking ? 'POLLING...' : 'CHECK NOW'}
            </button>
          </div>
          <div className="h-64">
            {healthHistory.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-mono text-neutral-600">
                NO HEALTH Sweeps LOGGED
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">SSL Certificate</h3>
                <Shield size={16} className="text-neutral-500" />
              </div>
              {sslInfo ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Issuer</div>
                    <div className="text-xs font-semibold text-neutral-250 mt-1 font-mono">{sslInfo.issuer || 'Self-Signed'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Subject</div>
                    <div className="text-xs font-semibold text-neutral-250 mt-1 font-mono">{sslInfo.subject || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Valid From</div>
                    <div className="text-xs font-semibold text-neutral-250 mt-1 font-mono">
                      {sslInfo.validFrom ? new Date(sslInfo.validFrom).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Valid To</div>
                    <div className="text-xs font-semibold text-neutral-250 mt-1 font-mono">
                      {sslInfo.validTo ? new Date(sslInfo.validTo).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Fingerprint</div>
                    <div className="text-[11px] font-semibold text-neutral-400 mt-1 font-mono break-all leading-normal">
                      {sslInfo.fingerprint || 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-mono text-neutral-600 py-4">NO ACTIVE CERTIFICATE LOGS</div>
              )}
            </div>
            {sslInfo && (
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Days Remaining</span>
                <span className={`text-xs font-bold font-mono ${sslInfo.daysRemaining < 30 ? 'text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md' : 'text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md'}`}>
                  {sslInfo.daysRemaining} days
                </span>
              </div>
            )}
          </div>

          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Port Scan Registry</h3>
              <Terminal size={16} className="text-neutral-500" />
            </div>
            {portsInfo && portsInfo.openPorts.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-4">
                {portsInfo.openPorts.map((port) => (
                  <span
                    key={port}
                    className="px-2.5 py-1 bg-neutral-800 border border-white/5 text-neutral-300 rounded-lg text-xs font-mono tracking-wider"
                  >
                    PORT:{port}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono text-neutral-600 py-4">ALL SPECIFIED PORTS SECURE / CLOSED</div>
            )}
            {portsInfo && (
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Last Scanned</span>
                <span className="text-xs font-semibold font-mono text-neutral-400">
                  {new Date(portsInfo.checkedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-white/5 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-350 uppercase tracking-widest">REMOVE DEVICE</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-neutral-500 hover:text-neutral-300 p-1 rounded-lg hover:bg-neutral-850 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-xs text-neutral-400 leading-relaxed font-mono">
                  CONFIRM DISPOSAL OF TARGET ENDPOINT DEVICE CONFIGURATION RECORD AND RETENTION LOG FILES.
                </p>
              </div>
              <div className="p-6 bg-neutral-950 border-t border-white/5 flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 border border-white/5 text-neutral-300 rounded-xl text-xs font-mono transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-mono transition-all"
                >
                  DISPOSE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}