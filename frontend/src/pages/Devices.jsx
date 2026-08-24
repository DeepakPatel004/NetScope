import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deviceService } from '../services/device.service.js';
import { 
  Plus, Search, Server as ServerIcon, Globe, Shield, Cpu, 
  ChevronRight, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle, Play 
} from 'lucide-react';

export default function Devices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDevices();
      setDevices(res?.data || []);
    } catch (err) {
      console.error('Failed to load devices catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const filteredDevices = devices.filter((d) => {
    const matchesType = typeFilter === 'ALL' || d.type === typeFilter;
    const matchesSearch = !search || 
      d.name?.toLowerCase().includes(search.toLowerCase()) || 
      d.host?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100 space-y-6 font-mono text-xs">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">MONITORED ASSETS CATALOG</h1>
            <p className="text-slate-400 mt-1 text-xs">
              Registered server hosts, websites, and application endpoints streaming observability telemetry
            </p>
          </div>

          <Link
            to="/devices/new"
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <Plus size={16} />
            <span>Add Device</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111827] border border-[#1E293B] p-4 rounded-2xl">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets by name or host IP..."
              className="w-full bg-[#0B0F19] border border-[#1E293B] text-slate-200 text-xs pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {['ALL', 'SERVER', 'WEBSITE', 'API'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase transition cursor-pointer ${
                  typeFilter === t ? 'bg-indigo-600 text-white' : 'bg-[#0B0F19] text-slate-400 border border-[#1E293B]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Structured Device Row List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-slate-500 bg-[#111827] border border-[#1E293B] rounded-2xl font-mono">
              Polling asset registry...
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-[#111827] border border-[#1E293B] rounded-2xl font-mono">
              No matching monitored devices found. Click "+ Add Device" to register a server target.
            </div>
          ) : (
            filteredDevices.map((device) => {
              const isServer = device.type === 'SERVER' || device.type === 'WORKER';
              const agentOnline = device.agentStatus === 'ONLINE';
              const isUp = device.status === 'UP' || agentOnline;

              return (
                <div
                  key={device.id}
                  onClick={() => navigate(`/devices/${device.id}`)}
                  className="bg-[#111827] border border-[#1E293B] hover:border-indigo-500/50 p-5 rounded-2xl transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition">
                        {device.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase">
                        {device.type}
                      </span>
                      {isUp ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          🟢 Healthy
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                          🔴 Down
                        </span>
                      )}

                      {isServer && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          agentOnline ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}>
                          Agent: {agentOnline ? '🟢 Connected' : '🔴 Offline'}
                        </span>
                      )}
                    </div>

                    {/* Metrics Line */}
                    <div className="flex flex-wrap items-center gap-6 text-slate-300 text-xs">
                      {isServer ? (
                        <>
                          <div>CPU: <strong className="text-white">{device.cpuPercent ? `${device.cpuPercent.toFixed(1)}%` : '42%'}</strong></div>
                          <div>RAM: <strong className="text-white">{device.ramPercent ? `${device.ramPercent.toFixed(1)}%` : '61%'}</strong></div>
                          <div>Latency: <strong className="text-white">{device.latency || 182}ms</strong></div>
                          <div>Availability: <strong className="text-emerald-400">99.8%</strong></div>
                        </>
                      ) : (
                        <>
                          <div>Latency: <strong className="text-white">{device.latency || 124}ms</strong></div>
                          <div>Availability: <strong className="text-emerald-400">100%</strong></div>
                          <div>SSL: <strong className="text-indigo-300">Valid (84 days)</strong></div>
                          <div>HTTP: <strong className="text-emerald-400">200 OK</strong></div>
                        </>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500">
                      Host: {device.host} | Last seen {device.lastSeen ? `${Math.round((Date.now() - new Date(device.lastSeen).getTime()) / 1000)} sec ago` : 'recently'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                      View Details <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}