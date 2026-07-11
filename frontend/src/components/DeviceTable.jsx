import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboard.service.js';
import { CheckCircle2, XCircle, HelpCircle, Activity, Globe, Shield, Terminal, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DeviceTable({ refreshTrigger }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await dashboardService.getDevicesStatus();
        setDevices(response.data);
      } catch (error) {
        console.error("Failed to fetch devices", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [refreshTrigger]); // re-fetch when refreshTrigger updates

  const getTypeIcon = (type) => {
    switch (type) {
      case 'WEBSITE':
        return <Globe size={14} className="text-blue-400" />;
      case 'API':
        return <Shield size={14} className="text-violet-400" />;
      case 'IP':
        return <Terminal size={14} className="text-amber-400" />;
      default:
        return <HelpCircle size={14} className="text-slate-400" />;
    }
  };

  if (loading && devices.length === 0) {
    return (
      <div className="mt-8 bg-slate-900/30 border border-slate-900 rounded-2xl p-8 text-center text-slate-500 animate-pulse">
        <Activity className="mx-auto mb-3 animate-spin text-indigo-500" size={24} />
        <span className="text-sm font-semibold">Updating device records...</span>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur-md">
      <div className="p-6 border-b border-slate-850 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Monitored Services
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Click any entry to view detailed health logs and check histories.</p>
        </div>
        <span className="text-xs font-bold bg-slate-850 px-2.5 py-1 rounded-lg text-indigo-400">
          {devices.length} Devices
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-850">
              <th className="p-5 font-semibold">Device Info</th>
              <th className="p-5 font-semibold">Type</th>
              <th className="p-5 font-semibold">Current Status</th>
              <th className="p-5 font-semibold">Latency</th>
              <th className="p-5 font-semibold">Last Checked</th>
              <th className="p-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/65">
            {devices.map((device) => (
              <tr
                key={device.id}
                onClick={() => navigate(`/devices/${device.id}`)}
                className="hover:bg-slate-900/30 transition-all duration-200 cursor-pointer group"
              >
                {/* Device Name and URL */}
                <td className="p-5">
                  <p className="font-semibold text-slate-200 group-hover:text-white text-sm transition-colors">
                    {device.name}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 max-w-xs truncate">{device.host}</p>
                </td>

                {/* Device Type */}
                <td className="p-5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-slate-900 border border-slate-800/80 text-slate-300">
                    {getTypeIcon(device.type)}
                    {device.type}
                  </span>
                </td>

                {/* Status Badge */}
                <td className="p-5">
                  {device.status === 'UP' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      UP
                    </span>
                  ) : device.status === 'DOWN' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      DOWN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>
                      UNKNOWN
                    </span>
                  )}
                </td>

                {/* Latency */}
                <td className="p-5 text-sm font-semibold text-slate-300 font-mono">
                  {device.latency ? (
                    <span className="flex items-center gap-1">
                      <Activity size={12} className="text-indigo-400/80" />
                      {device.latency} ms
                    </span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>

                {/* Timestamp */}
                <td className="p-5 text-xs text-slate-400 font-medium">
                  {device.lastChecked ? (
                    <span>
                      {new Date(device.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  ) : (
                    <span className="text-slate-600 font-bold uppercase tracking-wider">Never</span>
                  )}
                </td>

                {/* Action Arrow */}
                <td className="p-5 text-right">
                  <button className="p-1.5 bg-slate-900 group-hover:bg-indigo-600 text-slate-500 group-hover:text-white rounded-lg border border-slate-800 group-hover:border-indigo-500 transition-all duration-200">
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Empty State */}
            {devices.length === 0 && (
              <tr>
                <td colSpan="6" className="p-12 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 rounded-full mb-4">
                      <h1 size={32} />
                    </div>
                    <h3 className="text-base font-bold text-slate-200">No Services Configured</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      You haven't configured any network targets yet. Add some host URLs, API endpoints, or IP addresses to begin checks.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}