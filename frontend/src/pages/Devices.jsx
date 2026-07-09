import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deviceService } from '../services/device.service.js';
import { dashboardService } from '../services/dashboard.service.js';
import { 
  Plus, Globe, Shield, Terminal, Settings, Trash2, Eye, Edit3, 
  Play, Pause, AlertCircle, X, HelpCircle, Activity 
} from 'lucide-react';

export default function Devices() {
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
      // Fetch devices status to show status alongside configuration
      const response = await dashboardService.getDevicesStatus();
      setDevices(response.data);
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
    e.stopPropagation(); // Prevent card navigation
    setDeviceToDelete(device);
  };

  const handleConfirmDelete = async () => {
    if (!deviceToDelete) return;
    setDeleteLoading(true);
    try {
      await deviceService.deleteDevice(deviceToDelete.id);
      setDeviceToDelete(null);
      fetchDevicesData(); // Refresh list
    } catch (err) {
      console.error("Failed to delete device", err);
      alert("Failed to delete device: " + (err.response?.data?.message || err.message));
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
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Device Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">Configure and adjust monitoring endpoints.</p>
          </div>
          
          <Link
            to="/devices/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-5 py-3 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/10 transition-all"
          >
            <Plus size={16} />
            Add Device
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && devices.length === 0 ? (
          <div className="py-24 text-center text-slate-500">
            <Activity size={32} className="animate-spin text-indigo-500 mx-auto mb-4" />
            <span className="font-medium text-sm">Syncing device catalogs...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div
                key={device.id}
                onClick={() => navigate(`/devices/${device.id}`)}
                className="group relative bg-slate-900/40 border border-slate-900 hover:border-slate-850 rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Status and Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                        {getTypeIcon(device.type)}
                      </div>
                      <span className="text-[11px] font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 uppercase tracking-wider">
                        {device.type}
                      </span>
                    </div>

                    {/* Status Dot */}
                    <div>
                      {device.status === 'UP' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          UP
                        </span>
                      ) : device.status === 'DOWN' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          DOWN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          UNKNOWN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Device Name and Host */}
                  <h3 className="text-base font-bold text-slate-200 group-hover:text-white transition-colors">
                    {device.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-1 max-w-full truncate">
                    {device.host}
                  </p>
                </div>

                {/* Configuration details & Actions footer */}
                <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Settings size={14} className="text-slate-500" />
                      <span>{formatInterval(device.interval)}</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/devices/${device.id}`);
                      }}
                      title="View Details"
                      className="p-2 bg-slate-900 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-white rounded-lg transition-all"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/devices/edit/${device.id}`);
                      }}
                      title="Edit Configuration"
                      className="p-2 bg-slate-900 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-white rounded-lg transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => handleOpenDelete(e, device)}
                      title="Delete Device"
                      className="p-2 bg-slate-900 hover:bg-rose-600 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-white rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {!loading && devices.length === 0 && (
              <div className="col-span-full py-16 bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl text-center">
                <div className="p-4 bg-slate-900 border border-slate-850 rounded-full w-fit mx-auto mb-4 text-slate-500">
                  <Globe size={32} />
                </div>
                <h3 className="text-base font-bold text-slate-200">No Network Devices</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click the "+ Add Device" button to initialize a monitoring ping towards a website or server.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deviceToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 border-b border-slate-850 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-200">Delete Monitor Endpoint</h3>
                <button
                  onClick={() => setDeviceToDelete(null)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-850 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6">
                <div className="p-4 bg-rose-500/5 border border-rose-500/15 text-rose-400 rounded-xl flex gap-3 mb-4">
                  <AlertCircle className="shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Warning Action</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Are you sure you want to delete <span className="font-bold text-slate-200">{deviceToDelete.name}</span>?
                      This deletes all historical latency logs. This cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900/60 border-t border-slate-850 flex justify-end gap-3">
                <button
                  onClick={() => setDeviceToDelete(null)}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/10 transition-all disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Device'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}