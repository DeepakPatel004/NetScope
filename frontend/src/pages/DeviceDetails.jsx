import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate, NavLink, Outlet } from 'react-router-dom';
import { api } from '../services/api.js';
import { deviceService } from '../services/device.service.js';
import {
  ArrowLeft, Shield, Activity, Terminal, Settings,
  Trash2, Edit3, Play, AlertCircle, X, ShieldAlert
} from 'lucide-react';

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
  const [sslChecking, setSslChecking] = useState(false);
  const [portsChecking, setPortsChecking] = useState(false);
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

  const handleManualSSLCheck = async () => {
    setSslChecking(true);
    try {
      await deviceService.triggerSSLCheck(id);
      setTimeout(async () => {
        await fetchData();
        setSslChecking(false);
      }, 1500);
    } catch (err) {
      alert("Failed to trigger SSL check.");
      setSslChecking(false);
    }
  };

  const handleManualPortsCheck = async () => {
    setPortsChecking(true);
    try {
      await deviceService.triggerPortsCheck(id);
      setTimeout(async () => {
        await fetchData();
        setPortsChecking(false);
      }, 1500);
    } catch (err) {
      alert("Failed to trigger port scan.");
      setPortsChecking(false);
    }
  };

  const handleToggleEnabled = async () => {
    try {
      const updatedEnabled = !device.enabled;
      await deviceService.updateDevice(id, { enabled: updatedEnabled });
      setDevice((prev) => ({ ...prev, enabled: updatedEnabled }));
    } catch (err) {
      alert("Failed to update active state.");
    }
  };

  const handleIntervalChange = async (e) => {
    try {
      const newInterval = parseInt(e.target.value);
      await deviceService.updateDevice(id, { interval: newInterval });
      setDevice((prev) => ({ ...prev, interval: newInterval }));
    } catch (err) {
      alert("Failed to update ping interval.");
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  if (loading && !device) {
    return (
      <div className="p-8 bg-zinc-950 min-h-screen text-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity size={24} className="animate-spin text-emerald-400" />
          <span className="text-xs font-mono text-zinc-500">POLLING DEVICE DATAGRAMS...</span>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="p-8 bg-zinc-950 min-h-screen text-zinc-100 flex items-center justify-center">
        <div className="max-w-md text-center bg-zinc-900 border border-zinc-800/80 rounded-2xl p-8">
          <AlertCircle size={32} className="text-rose-400 mx-auto mb-4" />
          <h2 className="text-sm font-bold text-zinc-200">CONNECTION LOSS</h2>
          <p className="text-xs text-zinc-400 mt-2 font-mono">{error || "DEVICE REGISTRY EMPTY"}</p>
          <Link
            to="/devices"
            className="mt-6 inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-300 px-4 py-2 rounded-xl text-xs font-mono transition-all"
          >
            <ArrowLeft size={12} /> RETURN TO CATALOG
          </Link>
        </div>
      </div>
    );
  }

  const latestLog = healthHistory[0];
  const isHealthy = latestLog ? latestLog.status === 'UP' : false;

  const tabs = [
    { name: 'Overview', path: `/devices/${id}`, icon: Activity },
    { name: 'SSL Security', path: `/devices/${id}/ssl`, icon: Shield },
    { name: 'Port Scanner', path: `/devices/${id}/ports`, icon: Terminal },
    { name: 'Audit Ledger', path: `/devices/${id}/logs`, icon: Settings }
  ];

  return (
    <div className="p-8 bg-zinc-950 min-h-screen text-zinc-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/devices"
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all"
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
              <p className="text-xs text-zinc-500 font-mono mt-1">{device.host}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to={`/devices/edit/${id}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 px-3.5 py-2 rounded-xl text-xs font-mono transition-all"
            >
              <Edit3 size={12} />
              EDIT SETUP
            </Link>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-rose-950/20 border border-zinc-800/80 hover:border-rose-900/10 text-zinc-400 hover:text-rose-400 px-3.5 py-2 rounded-xl text-xs font-mono transition-all"
            >
              <Trash2 size={12} />
              DELETE
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-zinc-900 border border-zinc-800/80 p-4 rounded-2xl mb-8">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Active Monitor:</span>
            <button
              onClick={handleToggleEnabled}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${device.enabled ? 'bg-emerald-500' : 'bg-zinc-800'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${device.enabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 ml-0 sm:ml-6">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Interval:</span>
            <select
              value={device.interval}
              onChange={handleIntervalChange}
              className="bg-zinc-950 border border-zinc-800/80 text-zinc-300 rounded-lg text-xs font-mono py-1.5 px-3 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="1">1 Min</option>
              <option value="5">5 Min</option>
              <option value="15">15 Min</option>
              <option value="30">30 Min</option>
              <option value="60">60 Min</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 mb-8 bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800/80 max-w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 text-xs font-bold font-mono tracking-wider uppercase rounded-xl transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`
                }
              >
                <Icon size={13} />
                {tab.name}
              </NavLink>
            );
          })}
        </div>

        <Outlet context={{
          device,
          analytics,
          healthHistory,
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

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800/80 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">REMOVE DEVICE</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  CONFIRM DISPOSAL OF TARGET ENDPOINT DEVICE CONFIGURATION RECORD AND RETENTION LOG FILES.
                </p>
              </div>
              <div className="p-6 bg-zinc-950 border-t border-zinc-800/80 flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 rounded-xl text-xs font-mono transition-all"
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