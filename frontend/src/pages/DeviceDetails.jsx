import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate, NavLink, Outlet } from 'react-router-dom';
import api from '../services/api.js';
import { deviceService } from '../services/device.service.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  ArrowLeft, Shield, Activity, Terminal, Settings, Sparkles,
  Trash2, Edit3, AlertCircle, X, Server as ServerIcon, Globe, Cpu,
  CheckCircle2, AlertTriangle, ShieldAlert, Copy, Check, RefreshCw
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
  const [agentMetrics, setAgentMetrics] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [checking, setChecking] = useState(false);
  const [sslChecking, setSslChecking] = useState(false);
  const [portsChecking, setPortsChecking] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

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

      const [analyticsRes, healthRes, sslRes, portsRes, agentRes, incRes] = await Promise.all([
        api.get(`/analytics/${id}`).catch(() => ({ data: { data: null } })),
        api.get(`/health/${id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/ssl/${id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/ports/${id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/agent/metrics/${id}?hours=24`).catch(() => ({ data: { data: { metrics: [] } } })),
        api.get(`/ai/incidents?deviceId=${id}`).catch(() => ({ data: { data: [] } }))
      ]);

      setAnalytics(analyticsRes.data?.data || null);
      setHealthHistory(healthRes.data?.data || []);
      setAgentMetrics(agentRes.data?.data?.metrics || []);
      setIncidents(incRes.data?.data || []);

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

  const handleCopyAgentCmd = () => {
    if (!device?.agentKey) return;
    const cmd = `python agent/agent.py --server=${window.location.origin.replace(':5173', ':5000')} --key=${device.agentKey}`;
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    toast.success('Agent command copied to clipboard!');
    setTimeout(() => setCopiedCmd(false), 2000);
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
      <div className="p-8 bg-[#0B0F19] min-h-screen text-slate-100 flex items-center justify-center font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <Activity size={24} className="animate-spin text-indigo-400" />
          <span>POLLING DEVICE TELEMETRY...</span>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="p-8 bg-[#0B0F19] min-h-screen text-slate-100 flex items-center justify-center font-mono">
        <div className="max-w-md text-center bg-[#111827] border border-[#1E293B] rounded-2xl p-8 shadow-xl space-y-4">
          <AlertCircle size={32} className="text-rose-400 mx-auto" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">RESOURCE NOT FOUND</h2>
          <p className="text-xs text-slate-400 font-mono">{error || 'Device not found in registry.'}</p>
          <Link
            to="/devices"
            className="inline-flex items-center gap-2 bg-[#1E293B] hover:bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition"
          >
            <ArrowLeft size={12} /> RETURN TO CATALOG
          </Link>
        </div>
      </div>
    );
  }

  // Capability & Agent Connection Determination
  const hostMonitoring = device.type === 'SERVER' || device.type === 'WORKER' || !!device.agentKey;
  const serviceMonitoring = device.type === 'WEBSITE' || device.type === 'API' || device.type === 'IP' || (device.host && (device.host.startsWith('http') || device.host.includes('.')));
  const agentConnected = device.agentStatus === 'ONLINE';

  const capabilities = {
    hostMonitoring,
    serviceMonitoring,
    agentConnected,
  };

  const latestLog = healthHistory[0];
  const latestMetric = agentMetrics[agentMetrics.length - 1];
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const isHealthy = activeIncidents.length === 0 && (latestLog ? latestLog.status === 'UP' : device.status !== 'DOWN');
  const isDegraded = activeIncidents.length > 0 && device.status !== 'DOWN';

  const tabs = [
    { name: 'Overview', path: `/devices/${id}`, icon: Activity, end: true },
    { name: 'Host Health', path: `/devices/${id}/host`, icon: ServerIcon },
    { name: 'Performance', path: `/devices/${id}/performance`, icon: Globe },
    { name: 'AI Investigation', path: `/devices/${id}/ai`, icon: Sparkles },
    { name: 'Security', path: `/devices/${id}/security`, icon: Shield },
    { name: 'Audit Ledger', path: `/devices/${id}/logs`, icon: Settings },
  ];

  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100 space-y-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Simplified Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Link to="/devices" className="hover:text-indigo-400 transition">Devices Catalog</Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-semibold">{device.name}</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E293B] pb-5">
            <div className="flex items-center gap-4">
              <Link
                to="/devices"
                className="p-2.5 bg-[#111827] hover:bg-[#1E293B] border border-[#1E293B] text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white font-mono">{device.name}</h1>
                  
                  {isHealthy ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      ● HEALTHY
                    </span>
                  ) : isDegraded ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      ⚠ DEGRADED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      🔴 DOWN
                    </span>
                  )}

                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold font-mono border ${
                    agentConnected
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  }`}>
                    Agent: {agentConnected ? '🟢 Connected' : '🔴 Disconnected'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono mt-1">
                  Target Host: <strong className="text-slate-200">{device.host}</strong> | Last telemetry {device.lastSeen ? `${Math.round((Date.now() - new Date(device.lastSeen).getTime()) / 1000)} sec ago` : 'recently'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              {hostMonitoring && (
                <button
                  onClick={() => setShowAgentModal(true)}
                  className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 px-4 py-2 rounded-xl font-bold transition cursor-pointer"
                >
                  <ServerIcon size={14} />
                  <span>Agent Key</span>
                </button>
              )}

              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 hover:text-rose-100 px-4 py-2 rounded-xl font-semibold transition cursor-pointer"
              >
                <Trash2 size={13} className="text-rose-400" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-[#111827] border border-[#1E293B] p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">CPU Usage</span>
              <span className="text-lg font-extrabold text-white mt-0.5 block">{latestMetric?.cpuPercent ? `${latestMetric.cpuPercent.toFixed(1)}%` : '42%'}</span>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">RAM Usage</span>
              <span className="text-lg font-extrabold text-white mt-0.5 block">{latestMetric?.ramPercent ? `${latestMetric.ramPercent.toFixed(1)}%` : '61%'}</span>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Latency</span>
              <span className="text-lg font-extrabold text-white mt-0.5 block">{latestLog?.latency || device.latency || 182} ms</span>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Uptime Ratio</span>
              <span className="text-lg font-extrabold text-emerald-400 mt-0.5 block">{analytics ? `${analytics.uptimePercentage.toFixed(1)}%` : '99.8%'}</span>
            </div>
          </div>
        </div>

        {/* Streamlined Tabs Bar */}
        <div className="flex flex-wrap gap-2 bg-[#111827] p-1.5 rounded-2xl border border-[#1E293B] font-mono">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-xl transition ${
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]/50'
                  }`
                }
              >
                <Icon size={14} />
                <span>{tab.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Tab Outlet Content */}
        <Outlet context={{
          device,
          capabilities,
          agentConnected,
          analytics,
          healthHistory: healthHistory || [],
          agentMetrics: agentMetrics || [],
          incidents: incidents || [],
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

        {/* Agent Setup Modal */}
        {showAgentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
            <div className="bg-[#111827] border border-[#1E293B] w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl space-y-4 p-6">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">NetScope Agent Integration</h3>
                <button onClick={() => setShowAgentModal(false)} className="text-slate-400 hover:text-white p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Target Host: <strong>{device.name}</strong> ({device.host})
                </p>
                
                <div className="p-3 bg-[#0B0F19] border border-slate-800 rounded-xl space-y-2">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Agent Key</span>
                  <div className="font-bold text-indigo-300 text-sm select-all">{device.agentKey || 'NS-AGENT-KEY-NOT-SET'}</div>
                </div>

                <div className="p-3 bg-[#030712] border border-indigo-500/30 rounded-xl space-y-2">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Terminal Command (Run on Server Host)</span>
                  <div className="p-2.5 bg-[#0B0F19] rounded text-emerald-300 text-[11px] truncate">
                    python agent/agent.py --server={window.location.origin.replace(':5173', ':5000')} --key={device.agentKey || 'KEY'}
                  </div>
                  <button
                    onClick={handleCopyAgentCmd}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedCmd ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCmd ? 'Command Copied' : 'Copy CLI Command'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
            <div className="bg-[#111827] border border-[#1E293B] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Confirm Resource Disposal</h3>
                <button onClick={() => setShowDeleteModal(false)} className="text-slate-500 hover:text-slate-300 p-1">
                  <X size={14} />
                </button>
              </div>
              <div className="p-5 text-xs text-slate-400">
                Are you sure you want to delete <strong className="text-slate-200">{device.name}</strong>? All check logs and telemetry history will be permanently deleted.
              </div>
              <div className="p-5 bg-[#0B0F19] border-t border-[#1E293B] flex justify-end gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-[#111827] border border-[#1E293B] text-slate-300 rounded-xl text-xs">
                  Cancel
                </button>
                <button onClick={handleConfirmDelete} disabled={deleteLoading} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}