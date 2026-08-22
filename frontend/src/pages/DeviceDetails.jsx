import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate, NavLink, Outlet } from 'react-router-dom';
import { api } from '../services/api.js';
import { deviceService } from '../services/device.service.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  ArrowLeft, Shield, Activity, Terminal, Settings, Sparkles,
  Trash2, Edit3, AlertCircle, X
} from 'lucide-react';

export default function DeviceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [device, setDevice] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [sslInfo, setSslInfo] = useState(null);
  const [portsInfo, setPortsInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [checking, setChecking] = useState(false);
  const [sslChecking, setSslChecking] = useState(false);
  const [portsChecking, setPortsChecking] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const deviceRes = await api.get(`/devices/${id}`);
      const devData = deviceRes.data?.data || deviceRes.data;
      if (!devData) {
        throw new Error('Device not found');
      }
      setDevice(devData);

      const [analyticsRes, healthRes, sslRes, portsRes] = await Promise.all([
        api.get(`/analytics/${id}`).catch(() => ({ data: { data: null } })),
        api.get(`/health/${id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/ssl/${id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/ports/${id}`).catch(() => ({ data: { data: [] } }))
      ]);

      setAnalytics(analyticsRes.data?.data || null);
      setHealthHistory(healthRes.data?.data || []);

      if (sslRes.data?.data && sslRes.data.data.length > 0) {
        setSslInfo(sslRes.data.data[0]);
      } else {
        setSslInfo(null);
      }

      if (portsRes.data?.data && portsRes.data.data.length > 0) {
        setPortsInfo(portsRes.data.data[0]);
      } else {
        setPortsInfo(null);
      }
    } catch (err) {
      console.error('Failed to load device details:', err);
      setError('Failed to fetch device logs and configuration.');
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
      toast.success('Health diagnostics sweep dispatched');
      setTimeout(async () => {
        await fetchData();
        setChecking(false);
      }, 1500);
    } catch (err) {
      toast.error('Failed to queue health diagnostics');
      setChecking(false);
    }
  };

  const handleManualSSLCheck = async () => {
    setSslChecking(true);
    try {
      await deviceService.triggerSSLCheck(id);
      toast.success('TLS certificate audit dispatched');
      setTimeout(async () => {
        await fetchData();
        setSslChecking(false);
      }, 1500);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to trigger SSL check.';
      toast.error(message);
      setSslChecking(false);
    }
  };

  const handleManualPortsCheck = async () => {
    setPortsChecking(true);
    try {
      await deviceService.triggerPortsCheck(id);
      toast.success('TCP port scan audit dispatched');
      setTimeout(async () => {
        await fetchData();
        setPortsChecking(false);
      }, 1500);
    } catch (err) {
      toast.error('Failed to trigger port scan');
      setPortsChecking(false);
    }
  };

  const handleToggleEnabled = async () => {
    try {
      const updatedEnabled = !device.enabled;
      await deviceService.updateDevice(id, { enabled: updatedEnabled });
      setDevice((prev) => ({ ...prev, enabled: updatedEnabled }));
      toast.info(updatedEnabled ? 'Active monitoring enabled' : 'Active monitoring paused');
    } catch (err) {
      toast.error('Failed to update active state');
    }
  };

  const handleIntervalChange = async (e) => {
    try {
      const newInterval = parseInt(e.target.value);
      await deviceService.updateDevice(id, { interval: newInterval });
      setDevice((prev) => ({ ...prev, interval: newInterval }));
      toast.info(`Ping interval updated to ${newInterval} seconds`);
    } catch (err) {
      toast.error('Failed to update ping interval');
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deviceService.deleteDevice(id);
      toast.success('Device configuration removed');
      navigate('/devices');
    } catch (err) {
      toast.error('Deletion request failed');
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  if (loading && !device) {
    return (
      <div className="p-8 bg-[#0B0F19] min-h-screen text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity size={24} className="animate-spin text-indigo-400" />
          <span className="text-xs font-mono text-slate-400">POLLING DEVICE TELEMETRY...</span>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="p-8 bg-[#0B0F19] min-h-screen text-slate-100 flex items-center justify-center">
        <div className="max-w-md text-center bg-[#111827] border border-[#1E293B] rounded-2xl p-8 shadow-xl">
          <AlertCircle size={32} className="text-rose-400 mx-auto mb-4" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">CONNECTION LOSS / NOT FOUND</h2>
          <p className="text-xs text-slate-400 mt-2 font-mono">{error || 'Device not found in registry.'}</p>
          <Link
            to="/devices"
            className="mt-6 inline-flex items-center gap-2 bg-[#1E293B] hover:bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition"
          >
            <ArrowLeft size={12} /> RETURN TO CATALOG
          </Link>
        </div>
      </div>
    );
  }

  const latestLog = healthHistory[0];
  const isHealthy = latestLog ? latestLog.status === 'UP' : (device.status === 'UP' || true);

  const tabs = [
    { name: 'Overview', path: `/devices/${id}`, icon: Activity, end: true },
    { name: 'SSL Security', path: `/devices/${id}/ssl`, icon: Shield },
    { name: 'Port Scanner', path: `/devices/${id}/ports`, icon: Terminal },
    { name: 'Audit Ledger', path: `/devices/${id}/logs`, icon: Settings },
  ];

  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Professional Breadcrumb */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Link to="/devices" className="hover:text-indigo-400 transition">Devices Catalog</Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-semibold">{device.name}</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Endpoint Deep-Dive
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/devices"
                className="p-2 bg-[#111827] hover:bg-[#1E293B] border border-[#1E293B] text-slate-400 hover:text-white rounded-xl transition"
                title="Return to Monitored Endpoints Catalog"
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-white">{device.name}</h1>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-pulse'}`} />
                    <span className={`text-[10px] font-mono tracking-widest uppercase font-bold ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isHealthy ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">Target Host: <strong className="text-slate-200">{device.host}</strong></p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                to={`/devices/edit/${id}`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#111827] hover:bg-[#1E293B] border border-[#1E293B] text-slate-200 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition"
              >
                <Edit3 size={13} className="text-indigo-400" />
                EDIT SETUP
              </Link>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 hover:text-rose-100 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer"
              >
                <Trash2 size={13} className="text-rose-400" />
                DELETE
              </button>
            </div>
          </div>
        </div>

        {/* Monitor Toggle Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-[#111827] border border-[#1E293B] p-4 rounded-xl text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400 uppercase tracking-widest font-mono">Active Monitor:</span>
            <button
              onClick={handleToggleEnabled}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${device.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${device.enabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 ml-0 sm:ml-6">
            <span className="font-semibold text-slate-400 uppercase tracking-widest font-mono">Interval:</span>
            <select
              value={device.interval}
              onChange={handleIntervalChange}
              className="bg-[#0B0F19] border border-[#1E293B] text-slate-300 rounded-lg text-xs font-mono py-1.5 px-3 focus:outline-none"
            >
              <option value="30">30 Seconds</option>
              <option value="60">1 Minute</option>
              <option value="300">5 Minutes</option>
              <option value="900">15 Minutes</option>
              <option value="1800">30 Minutes</option>
              <option value="3600">60 Minutes</option>
            </select>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex flex-wrap gap-2 bg-[#111827] p-1.5 rounded-xl border border-[#1E293B] max-w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 text-xs font-bold font-mono tracking-wider uppercase rounded-lg transition ${
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]/50'
                  }`
                }
              >
                <Icon size={13} />
                {tab.name}
              </NavLink>
            );
          })}
        </div>

        {/* Tab Outlet Content */}
        <Outlet context={{
          device,
          analytics,
          healthHistory: healthHistory || [],
          sslInfo,
          portsInfo,
          checking,
          sslChecking,
          portsChecking,
          handleManualCheck,
          handleManualSSLCheck,
          handleManualPortsCheck,
          formatDate
        }} />

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-[#1E293B] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">REMOVE DEVICE</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  CONFIRM DISPOSAL OF TARGET ENDPOINT DEVICE CONFIGURATION RECORD AND RETENTION LOG FILES.
                </p>
              </div>
              <div className="p-5 bg-[#0B0F19] border-t border-[#1E293B] flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-[#111827] border border-[#1E293B] text-slate-300 rounded-xl text-xs font-mono transition"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-mono transition"
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