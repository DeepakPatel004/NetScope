import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deviceService } from '../services/device.service.js';
import { dashboardService } from '../services/dashboard.service.js';
import { useToast } from '../context/ToastContext.jsx';
import { 
  Plus, Globe, Shield, Terminal, Settings, Trash2, Eye, Edit3, 
  AlertCircle, X, HelpCircle, Activity, ChevronRight
} from 'lucide-react';

export default function Devices() {
  const toast = useToast();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Delete Modal State
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

  const fetchDevicesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getDevicesStatus();
      setDevices(response.data || []);
    } catch (err) {
      console.error("Failed to load devices", err);
      setError("Failed to fetch devices. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevicesData();
  }, []);

  const handleOpenDelete = (e, device) => {
    e.stopPropagation();
    setDeviceToDelete(device);
  };

  const handleConfirmDelete = async () => {
    if (!deviceToDelete) return;
    setDeleteLoading(true);
    try {
      await deviceService.deleteDevice(deviceToDelete.id);
      toast.success(`Device "${deviceToDelete.name}" removed successfully`);
      setDeviceToDelete(null);
      fetchDevicesData();
    } catch (err) {
      console.error("Failed to delete device", err);
      toast.error("Failed to delete device: " + (err.response?.data?.message || err.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'WEBSITE':
        return <Globe size={18} className="text-blue-400" />;
      case 'API':
        return <Shield size={18} className="text-violet-400" />;
      case 'IP':
        return <Terminal size={18} className="text-amber-400" />;
      default:
        return <HelpCircle size={18} className="text-slate-400" />;
    }
  };

  const formatInterval = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)} min`;
  };

  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Monitored Endpoints
              </h1>
              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {devices.length} Configured
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Select any endpoint below to inspect detailed health logs, SSL security validity, open port scans, and AI diagnostics
            </p>
          </div>
          
          <Link
            to="/devices/new"
            className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20 transition cursor-pointer"
          >
            <Plus size={16} />
            Add Endpoint
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && devices.length === 0 ? (
          <div className="py-24 text-center text-slate-500">
            <Activity size={32} className="animate-spin text-indigo-500 mx-auto mb-4" />
            <span className="font-medium text-xs font-mono">Syncing endpoint catalogs...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div
                key={device.id}
                onClick={() => navigate(`/devices/${device.id}`)}
                className="group bg-[#111827] border border-[#1E293B] hover:border-[#6366F1]/60 rounded-xl p-6 transition duration-200 cursor-pointer flex flex-col justify-between shadow-xl"
              >
                <div>
                  {/* Status and Type Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-[#0B0F19] border border-[#1E293B] rounded-lg">
                        {getTypeIcon(device.type)}
                      </div>
                      <span className="text-[10px] font-bold bg-[#0B0F19] border border-[#1E293B] px-2 py-0.5 rounded text-slate-300 uppercase tracking-wider">
                        {device.type}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {device.status === 'UP' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          ONLINE
                        </span>
                      ) : device.status === 'DOWN' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          DOWN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 border border-slate-700 text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          UNKNOWN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Device Name and Host */}
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {device.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1 truncate">
                    {device.host}
                  </p>
                </div>

                {/* Card Action Footer */}
                <div className="mt-6 pt-4 border-t border-[#1E293B] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <Settings size={13} className="text-slate-500" />
                    <span>Interval: {formatInterval(device.interval)}</span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/devices/${device.id}`);
                      }}
                      title="View Endpoint Diagnostics"
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      <span>Diagnostics</span>
                      <ChevronRight size={14} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/devices/edit/${device.id}`);
                      }}
                      title="Edit Setup"
                      className="p-1.5 bg-[#0B0F19] hover:bg-slate-800 border border-[#1E293B] text-slate-400 hover:text-white rounded-lg transition"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      onClick={(e) => handleOpenDelete(e, device)}
                      title="Delete Device"
                      className="p-1.5 bg-[#0B0F19] hover:bg-rose-600 border border-[#1E293B] hover:border-rose-500 text-slate-400 hover:text-white rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {!loading && devices.length === 0 && (
              <div className="col-span-full py-16 bg-[#111827] border border-dashed border-[#1E293B] rounded-2xl text-center">
                <div className="p-4 bg-[#0B0F19] border border-[#1E293B] rounded-full w-fit mx-auto mb-4 text-slate-500">
                  <Globe size={32} />
                </div>
                <h3 className="text-base font-bold text-slate-200">No Endpoint Targets Registered</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Click the "+ Add Endpoint" button to initialize monitoring pings towards your web application, REST API, or server IP.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deviceToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-[#1E293B] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-[#1E293B] flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Remove Endpoint Record</h3>
                <button
                  onClick={() => setDeviceToDelete(null)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6">
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex gap-3 mb-4 text-xs font-mono">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="font-bold uppercase tracking-wider">Confirm Deletion</h4>
                    <p className="text-slate-400 mt-1 leading-relaxed">
                      Are you sure you want to delete <span className="font-bold text-slate-200">{deviceToDelete.name}</span>?
                      This permanently removes all historical latency check logs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#0B0F19] border-t border-[#1E293B] flex justify-end gap-3 font-mono">
                <button
                  onClick={() => setDeviceToDelete(null)}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-[#111827] border border-[#1E293B] text-slate-300 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Endpoint'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}