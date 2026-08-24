import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deviceService } from '../services/device.service.js';
import { useToast } from '../context/ToastContext.jsx';
import api from '../services/api.js';
import { 
  Save, ArrowLeft, Server as ServerIcon, Cpu, Loader2, 
  Check, Copy, CheckCircle2, ShieldAlert, Sparkles, Terminal, Info, HelpCircle
} from 'lucide-react';

export default function AddDevice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = !!id;

  const [step, setStep] = useState(1); // 1: Add Server Form, 2: NetScope Agent Setup & Discovery
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState(null);

  // Agent & Discovered Services state
  const [agentData, setAgentData] = useState(null);
  const [agentStatus, setAgentStatus] = useState('NOT_CONNECTED'); // 'NOT_CONNECTED', 'ONLINE'
  const [discoveredServices, setDiscoveredServices] = useState([]);
  const [primaryService, setPrimaryService] = useState('');
  const [copied, setCopied] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    environment: 'Production',
    interval: 30,
  });

  useEffect(() => {
    if (!isEditMode) return;

    const fetchDevice = async () => {
      try {
        setFetching(true);
        setError(null);
        const response = await deviceService.getDeviceById(id);
        const device = response.data;
        if (device) {
          setFormData({
            name: device.name,
            host: device.host || 'localhost',
            environment: device.environment || 'Production',
            interval: device.interval || 30,
          });
          if (device.agentKey) {
            setAgentData({
              deviceId: device.id,
              deviceName: device.name,
              agentKey: device.agentKey,
              installCommand: `python agent/agent.py --server=http://localhost:5000 --key=${device.agentKey}`,
            });
            setAgentStatus(device.agentStatus || 'NOT_CONNECTED');
            setStep(2);
          }
        }
      } catch (err) {
        setError('Error loading device configuration.');
      } finally {
        setFetching(false);
      }
    };

    fetchDevice();
  }, [id, isEditMode]);

  // Polling for Agent status and discovered services on Step 2
  useEffect(() => {
    if (step !== 2 || !agentData?.deviceId) return;

    let timer;
    const checkAgentState = async () => {
      try {
        const metricsRes = await api.get(`/agent/metrics/${agentData.deviceId}?hours=1`);
        const dev = metricsRes.data?.data?.device;
        const metrics = metricsRes.data?.data?.metrics || [];

        if (dev?.agentStatus === 'ONLINE' || metrics.length > 0) {
          setAgentStatus('ONLINE');
          setLiveMetrics(metrics[metrics.length - 1] || null);

          // Fetch discovered services from Agent
          const svcRes = await api.get(`/agent/discovered-services/${agentData.deviceId}`);
          const svcs = svcRes.data?.data?.discoveredServices || [];
          setDiscoveredServices(svcs);

          if (!primaryService && svcs.length > 0) {
            setPrimaryService(svcs[0]);
          }
        } else {
          setAgentStatus(dev?.agentStatus || 'NOT_CONNECTED');
        }
      } catch (err) {
        // silent polling catch
      }
    };

    checkAgentState();
    timer = setInterval(checkAgentState, 4000);
    return () => clearInterval(timer);
  }, [step, agentData, primaryService]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'interval' ? Number(value) : value)
    }));
  };

  const handleCreateServer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name: formData.name.trim(),
      host: formData.host.trim() || 'localhost',
      type: 'SERVER',
      metricsSource: 'NETSCOPE_AGENT',
      interval: Number(formData.interval) || 30,
      enabled: true,
      environment: formData.environment,
    };

    try {
      let serverDevice;
      if (isEditMode) {
        const res = await deviceService.updateDevice(id, payload);
        serverDevice = res.data;
        toast.success(`Server "${formData.name}" updated successfully`);
      } else {
        const res = await deviceService.createDevice(payload);
        serverDevice = res.data;
        toast.success(`Server "${formData.name}" added successfully`);
      }

      // Register Agent key for this Server
      try {
        const regRes = await api.post('/agent/register', { deviceId: serverDevice.id });
        const regData = regRes.data?.data;
        setAgentData(regData);
      } catch (regErr) {
        setAgentData({
          deviceId: serverDevice.id,
          deviceName: serverDevice.name,
          agentKey: serverDevice.agentKey || 'agent_demo_key_123',
          installCommand: `python agent/agent.py --server=http://localhost:5000 --key=${serverDevice.agentKey || 'agent_demo_key_123'}`,
        });
      }

      setStep(2); // Move to NetScope Agent Setup screen
    } catch (err) {
      console.error('Add server failed', err);
      const msg = err.response?.data?.message || 'Failed to add server.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimaryService = async (serviceName) => {
    setPrimaryService(serviceName);
    if (!agentData?.deviceId) return;
    try {
      await api.put(`/agent/primary-service/${agentData.deviceId}`, { serviceName });
      toast.success(`Primary service set to "${serviceName}"`);
    } catch (err) {
      console.warn('Failed to save primary service:', err);
    }
  };

  const handleCopyCommand = () => {
    if (!agentData?.agentKey) return;
    const cmd = `python agent/agent.py --server=${window.location.origin.replace(':5173', ':5000')} --key=${agentData.agentKey}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    toast.success('Agent command copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (fetching) {
    return (
      <div className="p-8 bg-[#0B0F19] min-h-screen text-slate-100 flex items-center justify-center font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <span>Syncing server configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (step === 2 && !isEditMode) setStep(1);
                else navigate('/devices');
              }}
              className="p-2.5 bg-[#111827] border border-[#1E293B] text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
                <ServerIcon className="text-indigo-400" size={28} />
                <span>{isEditMode ? 'Edit Server' : step === 1 ? 'Add Server' : 'NetScope Agent Setup'}</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {step === 1 ? 'Register host target for automatic observability & AI investigation' : 'Install NetScope Agent on your server host to start collecting telemetry'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span className={`px-3 py-1 rounded-full font-bold ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>1. Add Server</span>
            <span>&rarr;</span>
            <span className={`px-3 py-1 rounded-full font-bold ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>2. Agent Setup</span>
          </div>
        </div>

            {/* STEP 1: ADD SERVER FORM */}
            {step === 1 && (
              <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 text-slate-300 rounded-xl text-xs space-y-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-400 block">✦ AUTOMATIC HOST & SERVICE OBSERVABILITY</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">Docker & Compose</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    NetScope automatically collects CPU, RAM, Disk, System Load, and Docker telemetry once the NetScope Agent is connected.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2 font-mono">
                    <ShieldAlert size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleCreateServer} className="space-y-6 font-mono text-xs">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Server Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Production API Server"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#0B0F19] border border-[#1E293B] focus:border-indigo-500 rounded-xl text-slate-100 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Environment <span className="text-rose-400">*</span>
                      </label>
                      <select
                        name="environment"
                        value={formData.environment}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-[#1E293B] focus:border-indigo-500 rounded-xl text-slate-100 outline-none cursor-pointer"
                      >
                        <option value="Production">Production</option>
                        <option value="Staging">Staging</option>
                        <option value="Development">Development</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Host IP / Hostname (Optional)
                      </label>
                      <input
                        type="text"
                        name="host"
                        placeholder="e.g. 192.168.1.100 or localhost"
                        value={formData.host}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-[#1E293B] focus:border-indigo-500 rounded-xl text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Telemetry Reporting Interval
                    </label>
                    <select
                      name="interval"
                      value={formData.interval}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#0B0F19] border border-[#1E293B] focus:border-indigo-500 rounded-xl text-slate-100 outline-none cursor-pointer"
                    >
                      <option value={15}>Every 15 Seconds</option>
                      <option value={30}>Every 30 Seconds</option>
                      <option value={60}>Every 1 Minute</option>
                      <option value={300}>Every 5 Minutes</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
                    <button
                      type="button"
                      onClick={() => navigate('/devices')}
                      className="px-5 py-2.5 bg-[#0B0F19] border border-[#1E293B] text-slate-300 rounded-xl text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                      <Save size={15} />
                      <span>{loading ? 'Creating Server...' : 'Add Server & Setup Agent \u2192'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: NETSCOPE AGENT SETUP & DISCOVERY SCREEN */}
            {step === 2 && agentData && (
              <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl font-mono text-xs">
                {/* Header & Connection Status */}
                <div className="border-b border-[#1E293B] pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px] block uppercase font-bold">Target Server</span>
                    <span className="text-lg font-extrabold text-white">{formData.name}</span>
                  </div>

                  <div>
                    {agentStatus === 'ONLINE' ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-extrabold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 animate-pulse">
                        <CheckCircle2 size={15} /> 🟢 Agent Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-extrabold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                        <Loader2 size={15} className="animate-spin" /> ● Waiting for Connection
                      </span>
                    )}
                  </div>
                </div>

                {/* UNIFIED SLEEK INSTALLATION & RECOVERY CARD */}
                <div className="p-5 bg-[#030712] border border-indigo-500/30 rounded-2xl space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="font-extrabold text-indigo-400 text-xs flex items-center gap-2">
                      <Terminal size={15} /> AGENT INSTALLATION GUIDE
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded font-bold">
                      Agent Key: <strong className="text-indigo-300">{agentData.agentKey}</strong>
                    </span>
                  </div>

                  <div className="space-y-3 text-[11px]">
                    <div>
                      <span className="text-slate-400 text-[10px] block mb-1">1. CLONE AGENT REPOSITORY</span>
                      <div className="p-2.5 bg-[#0B0F19] rounded-lg border border-slate-800 text-slate-200 select-all font-mono">
                        git clone https://github.com/DeepakPatel004/NetScope.git && cd NetScope/agent
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block mb-1">2. INSTALL DEPENDENCIES</span>
                      <div className="p-2.5 bg-[#0B0F19] rounded-lg border border-slate-800 text-slate-200 select-all font-mono">
                        pip install -r requirements.txt
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block mb-1">3. LAUNCH AGENT DAEMON</span>
                      <div className="p-3 bg-[#0B0F19] rounded-lg border border-indigo-500/40 text-emerald-300 flex items-center justify-between gap-3 font-mono">
                        <span className="truncate select-all">
                          python agent.py --server={window.location.origin.replace(':5173', ':5000')} --key={agentData.agentKey}
                        </span>
                        <button
                          onClick={handleCopyCommand}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copied ? 'Copied' : 'Copy Command'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>🔒 Auto-Remediation Targets: <strong className="text-emerald-400">Docker Containers</strong> & <strong className="text-emerald-400">Docker Compose</strong></span>
                    <span className="text-slate-500">Allowlisted Subprocess Execution</span>
                  </div>
                </div>

            {/* DISCOVERED CAPABILITIES PANEL (When Agent Connects) */}
            {agentStatus === 'ONLINE' ? (
              <div className="space-y-5 pt-2 border-t border-[#1E293B]">
                <div className="p-5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} /> NetScope Agent Discovered Capabilities
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded font-bold">
                      Linux / Host Telemetry
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-200">
                    <div className="p-2.5 bg-[#0B0F19] rounded-lg border border-slate-800">
                      <span className="text-emerald-400 font-bold block">✓ Host Metrics</span>
                      <span className="text-[10px] text-slate-400">CPU, RAM, Disk, Load</span>
                    </div>
                    <div className="p-2.5 bg-[#0B0F19] rounded-lg border border-slate-800">
                      <span className="text-emerald-400 font-bold block">✓ Process Metrics</span>
                      <span className="text-[10px] text-slate-400">Top CPU/RAM processes</span>
                    </div>
                    <div className="p-2.5 bg-[#0B0F19] rounded-lg border border-slate-800">
                      <span className="text-emerald-400 font-bold block">✓ Service Discovery</span>
                      <span className="text-[10px] text-slate-400">systemd service units</span>
                    </div>
                  </div>

                  {/* Primary Service Selection */}
                  <div className="pt-2 space-y-2 border-t border-emerald-500/20">
                    <label className="block text-slate-200 font-bold">
                      Select Primary Application Service to Monitor & Correlate:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(discoveredServices.length > 0 ? discoveredServices : ['nginx.service', 'postgresql.service', 'redis.service']).map((svc) => (
                        <button
                          key={svc}
                          type="button"
                          onClick={() => handleSetPrimaryService(svc)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                            primaryService === svc
                              ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                              : 'bg-[#0B0F19] border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          {primaryService === svc ? '● ' : '○ '}{svc}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      NetScope correlates host CPU/RAM metrics deeply with your selected primary service <strong>{primaryService || 'nginx.service'}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#0B0F19] border border-[#1E293B] rounded-xl space-y-2 text-slate-400">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Info size={16} />
                  <span>Waiting for Agent Connection...</span>
                </div>
                <p className="text-slate-400">
                  Run the command above on your server. As soon as the Agent establishes its first heartbeat connection, NetScope will automatically discover available systemd services and host capabilities.
                </p>
              </div>
            )}

            {/* Finish Action */}
            <div className="flex justify-between items-center pt-4 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-[#0B0F19] border border-[#1E293B] text-slate-300 rounded-xl text-xs transition cursor-pointer"
              >
                &larr; Back
              </button>

              <button
                onClick={() => navigate('/devices')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                Complete Setup & View Dashboard &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}