import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboard.service.js';
import { deviceService } from '../services/device.service.js';
import { 
  ArrowLeft, Activity, Clock, CheckCircle2, AlertTriangle, 
  Trash2, Edit3, Play, X, AlertCircle, Calendar, ShieldAlert 
} from 'lucide-react';

export default function DeviceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Manual Check States
  const [checking, setChecking] = useState(false);
  const [checkSuccess, setCheckSuccess] = useState(false);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDeviceDetails = useCallback(async () => {
    try {
      setError(null);
      const response = await dashboardService.getDeviceDetails(id);
      setData(response.data);
    } catch (err) {
      console.error("Failed to load device details", err);
      setError("Failed to fetch device analytics.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDeviceDetails();
  }, [fetchDeviceDetails]);

  const handleManualCheck = async () => {
    setChecking(true);
    setCheckSuccess(false);
    try {
      await deviceService.triggerManualCheck(id);
      // Wait 1.5 seconds for the background worker to finish the check
      setTimeout(async () => {
        await fetchDeviceDetails();
        setChecking(false);
        setCheckSuccess(true);
        // Clear success notification after 3 seconds
        setTimeout(() => setCheckSuccess(false), 3000);
      }, 1500);
    } catch (err) {
      console.error("Manual check trigger failed", err);
      alert("Failed to queue check: " + (err.response?.data?.message || err.message));
      setChecking(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deviceService.deleteDevice(id);
      navigate('/devices');
    } catch (err) {
      console.error("Failed to delete device", err);
      alert("Failed to delete: " + (err.response?.data?.message || err.message));
      setDeleteLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity size={32} className="animate-spin text-indigo-500" />
          <span className="text-sm font-semibold text-slate-500">Loading diagnostic details...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-slate-100 flex items-center justify-center">
        <div className="max-w-md text-center bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <AlertCircle size={40} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-200">Sync Failure</h2>
          <p className="text-xs text-slate-400 mt-2">{error || "Monitored device record does not exist."}</p>
          <Link
            to="/devices"
            className="mt-6 inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <ArrowLeft size={14} /> Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  // Identify current status based on latest logs
  const latestLog = data.timeline?.[0];
  const isUp = latestLog ? latestLog.status === 'UP' : false;

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Navigation & Actions Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/devices"
              className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">{data.deviceInfo.name}</h1>
                <span className="text-[11px] font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 uppercase tracking-wider">
                  {data.deviceInfo.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">{data.deviceInfo.host}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Edit */}
            <Link
              to={`/devices/edit/${id}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              <Edit3 size={14} />
              Edit Setup
            </Link>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/50 text-slate-400 hover:text-rose-400 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              <Trash2 size={14} />
              Delete Endpoint
            </button>
          </div>
        </div>

        {/* Analytics Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card: Current Status */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Service Health</div>
            <div className="flex items-center gap-2.5">
              {latestLog ? (
                isUp ? (
                  <>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/20 animate-pulse"></span>
                    <span className="text-xl font-bold text-emerald-400">UP / ONLINE</span>
                  </>
                ) : (
                  <>
                    <span className="w-3 h-3 rounded-full bg-rose-500 shadow-md shadow-rose-500/20 animate-pulse"></span>
                    <span className="text-xl font-bold text-rose-400">DOWN / OFFLINE</span>
                  </>
                )
              ) : (
                <>
                  <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                  <span className="text-xl font-bold text-slate-400">UNKNOWN</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">Checked status by daemon workers</p>
          </div>

          {/* Card: Uptime */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Uptime Index</div>
            <div className="text-2xl font-bold text-slate-100">
              {data.analytics.uptimePercentage}%
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-3 border border-slate-900">
              <div 
                className={`h-full rounded-full ${
                  data.analytics.uptimePercentage > 95 
                    ? 'bg-emerald-500' 
                    : (data.analytics.uptimePercentage > 85 ? 'bg-amber-500' : 'bg-rose-500')
                }`}
                style={{ width: `${data.analytics.uptimePercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Card: Avg Latency */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Average Response</div>
            <div className="text-2xl font-bold text-slate-100 flex items-center gap-1.5 font-mono">
              <Activity size={18} className="text-indigo-400" />
              {data.analytics.averageLatency} ms
            </div>
            <p className="text-[10px] text-slate-500 mt-3 font-medium">Mean check duration metrics</p>
          </div>

          {/* Card: Last Seen */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Last Seen UP</div>
            <div className="text-base font-bold text-slate-100 flex items-center gap-1.5">
              <Clock size={16} className="text-slate-400 shrink-0" />
              <span className="truncate">
                {data.analytics.lastSeen 
                  ? new Date(data.analytics.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Never'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 font-medium">
              {data.analytics.lastSeen 
                ? new Date(data.analytics.lastSeen).toLocaleDateString([], { month: 'short', day: 'numeric' })
                : 'No successful checks logged'}
            </p>
          </div>
        </div>

        {/* Manual Trigger Bar */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-3 items-start text-center sm:text-left">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl hidden sm:block">
              <Play size={18} className="rotate-90" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Manual Health Check Dispatcher</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bypass scheduler limits and trigger immediate latency checks on this host endpoint.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            {checkSuccess && (
              <span className="text-xs font-bold text-emerald-400 animate-fade-in">Check completed successfully</span>
            )}
            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-900 text-white disabled:text-slate-600 border border-transparent disabled:border-slate-850 px-6 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              {checking ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                  Checking Host...
                </>
              ) : (
                'Check Now'
              )}
            </button>
          </div>
        </div>

        {/* GitHub/Kuma-style Health Timeline */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-200">Uptime History (Last 50 checks)</h3>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {data.timeline?.length || 0} checks logged
            </span>
          </div>

          {/* Timeline Blocks */}
          <div className="flex gap-1.5 flex-wrap py-2">
            {/* Pad the timeline if less than 50 logs */}
            {Array.from({ length: Math.max(0, 50 - (data.timeline?.length || 0)) }).map((_, idx) => (
              <div 
                key={`empty-${idx}`} 
                className="w-3.5 h-7 rounded-sm bg-slate-950 border border-slate-900" 
                title="No checks logged"
              />
            ))}
            
            {/* Render actual check logs (reversed to read left-to-right: oldest to newest) */}
            {[...(data.timeline || [])].reverse().map((log) => {
              const logDateStr = new Date(log.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const logTitle = `[${log.status}] ${logDateStr}${log.latency ? ` - ${log.latency}ms` : ''}${log.errorMessage ? ` (${log.errorMessage})` : ''}`;
              
              return (
                <div
                  key={log.id}
                  className={`w-3.5 h-7 rounded-sm transition-all hover:scale-y-110 cursor-help ${
                    log.status === 'UP' 
                      ? 'bg-emerald-500/85 hover:bg-emerald-400' 
                      : 'bg-rose-500 hover:bg-rose-400'
                  }`}
                  title={logTitle}
                />
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3.5">
            <span>50 checks ago</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-sm"></span> UP</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-500 rounded-sm"></span> DOWN</span>
            </div>
            <span>Just Now</span>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-850">
            <h3 className="text-sm font-bold text-slate-200">Recent Checks Log</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Details of latency and error codes for past monitoring polls.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850">
                  <th className="p-4 font-semibold">Check Time</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Latency</th>
                  <th className="p-4 font-semibold">Diagnosis / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/65">
                {data.timeline?.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/20 transition-all duration-150">
                    <td className="p-4 font-medium text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-500" />
                        {new Date(log.checkedAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.status === 'UP' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                          UP
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400">
                          DOWN
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-350">
                      {log.latency ? `${log.latency} ms` : '-'}
                    </td>
                    <td className="p-4">
                      {log.status === 'UP' ? (
                        <span className="text-slate-500 font-medium">Connection successful</span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <ShieldAlert size={12} />
                          {log.errorMessage || 'Connection timed out'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {(!data.timeline || data.timeline.length === 0) && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500 font-medium">
                      No health checks logged yet for this device.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 border-b border-slate-850 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-200">Delete Monitor Endpoint</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-850 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6">
                <div className="p-4 bg-rose-500/5 border border-rose-500/15 text-rose-400 rounded-xl flex gap-3 mb-4">
                  <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Warning Action</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Are you sure you want to delete <span className="font-bold text-slate-200">{data.deviceInfo.name}</span>?
                      This deletes all historical latency logs. This cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900/60 border-t border-slate-850 flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-350 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
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