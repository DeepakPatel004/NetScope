import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboard.service.js';
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
      const res = await dashboardService.getDevicesStatus();
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
    <div className="p-6 md:p-8 bg-[#101214] min-h-screen text-slate-100 space-y-6 font-sans text-xs">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b3036] pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">Devices</h1>
            <p className="text-slate-400 mt-1 text-xs">
              Registered server hosts, websites, and application endpoints streaming observability telemetry
            </p>
          </div>

          <Link
            to="/devices/new"
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm "
          >
            <Plus size={16} />
            <span>Add Device</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#181b1f] border border-[#2b3036] p-4 rounded-xl">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets by name or host IP..."
              className="w-full bg-[#101214] border border-[#2b3036] text-slate-200 text-xs pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {['ALL', 'SERVER', 'WEBSITE', 'API'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase transition cursor-pointer ${
                  typeFilter === t ? 'bg-teal-600 text-white' : 'bg-[#101214] text-slate-400 border border-[#2b3036]'
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
            <div className="p-8 text-center text-slate-500 bg-[#181b1f] border border-[#2b3036] rounded-xl font-sans">
              Polling asset registry...
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-[#181b1f] border border-[#2b3036] rounded-xl font-sans">
              No matching monitored devices found. Click "+ Add Device" to register a server target.
            </div>
          ) : (
            filteredDevices.map((device) => {
              const isServer = device.type === 'SERVER' || device.type === 'WORKER';
              const isUp = device.status === 'UP';

              return (
                <div
                  key={device.id}
                  onClick={() => navigate(`/devices/${device.id}`)}
                  className="bg-[#181b1f] border border-[#2b3036] hover:border-teal-500/50 p-5 rounded-xl transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-white group-hover:text-teal-300 transition">
                        {device.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase">
                        {device.type}
                      </span>
                      {isUp ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          🟢 Healthy
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                          {device.status === 'DOWN' ? 'Down' : 'Unknown'}
                        </span>
                      )}

                    </div>

                    {/* Metrics Line */}
                    <div className="flex flex-wrap items-center gap-6 text-slate-300 text-xs">
                      <div>Latency: <strong className="text-white">{device.latency == null ? "—" : `${device.latency} ms`}</strong></div>
                    </div>

                    <div className="text-[10px] text-slate-500">
                      Host: {device.host} | Last seen {device.lastChecked ? `${Math.round((Date.now() - new Date(device.lastChecked).getTime()) / 1000)} sec ago` : 'not recorded'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <span className="text-xs font-bold text-teal-400 group-hover:text-teal-300 flex items-center gap-1">
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