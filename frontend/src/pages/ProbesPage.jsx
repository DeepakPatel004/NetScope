import React, { useState, useEffect } from 'react';
import { Radio, Plus, RefreshCw, Key, ShieldAlert, CheckCircle2, Clock, Globe, Copy, Check } from 'lucide-react';
import api from '../services/api.js';

export default function ProbesPage() {
  const [probes, setProbes] = useState([]);
  const [fleetStats, setFleetStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [newProbeName, setNewProbeName] = useState('');
  const [newProbeRegion, setNewProbeRegion] = useState('');
  const [enrolledResult, setEnrolledResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const isAdmin = user?.role === 'ADMIN';

  const loadProbes = async () => {
    try {
      setLoading(true);
      setError('');
      const [fleetRes, adminRes] = await Promise.all([
        api.get('/probes/fleet'),
        isAdmin ? api.get('/probes/admin').catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
      ]);

      const fleetData = fleetRes.data?.data || {};
      setFleetStats(fleetData);
      setProbes(isAdmin && adminRes.data?.data?.length ? adminRes.data.data : fleetData.probes || []);
    } catch (err) {
      setError('Failed to load probe fleet. Probes may be unreachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProbes();
  }, []);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!newProbeName || !newProbeRegion) return;
    setActionLoading(true);
    try {
      const res = await api.post('/probes/admin/enroll', {
        name: newProbeName,
        region: newProbeRegion,
      });
      setEnrolledResult(res.data?.data);
      setNewProbeName('');
      setNewProbeRegion('');
      loadProbes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to enroll probe. Make sure you have Admin rights.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRotate = async (probeId) => {
    if (!confirm('Are you sure you want to rotate this probe’s credentials? The old token will be immediately invalidated.')) return;
    try {
      const res = await api.post(`/probes/admin/${probeId}/rotate-token`);
      alert(`New Probe Token (copy now):\n\n${res.data?.data?.rawToken}`);
      loadProbes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rotate token');
    }
  };

  const handleRevoke = async (probeId) => {
    if (!confirm('Are you sure you want to revoke this probe? It will be blocked from fetching assignments or submitting observations.')) return;
    try {
      await api.post(`/probes/admin/${probeId}/revoke`);
      loadProbes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke probe');
    }
  };

  return (
    <div className="p-6 md:p-8 bg-[#101214] min-h-screen text-slate-100 space-y-7 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b3036] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Radio className="text-teal-400" size={24} />
            <h1 className="text-2xl font-bold tracking-tight text-white">Monitoring Probes Fleet</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Independently deployed monitoring agents providing multi-region endpoint cross-verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProbes}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181b1f] border border-[#2b3036] text-xs text-slate-300 hover:text-white transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {isAdmin && (
            <button
              onClick={() => { setEnrolledResult(null); setShowEnrollModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-sm transition"
            >
              <Plus size={14} /> Enroll New Probe
            </button>
          )}
        </div>
      </div>

      {error && <p className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg">{error}</p>}

      {/* Fleet KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Total Probes', fleetStats?.totalProbes ?? probes.length, 'Registered in fleet', Radio],
          ['Online Probes', fleetStats?.onlineProbes ?? probes.filter(p => p.status === 'ONLINE').length, 'Heartbeat within 60s', CheckCircle2],
          ['Active Regions', fleetStats?.regions?.length ?? new Set(probes.map(p => p.region)).size, 'Independent vantage points', Globe],
          ['Revoked Probes', fleetStats?.revokedProbes ?? probes.filter(p => p.status === 'REVOKED').length, 'Revoked credentials', ShieldAlert],
        ].map(([label, value, hint, Icon]) => (
          <div key={label} className="rounded-xl border border-[#2b3036] bg-[#181b1f] p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">{label}</span>
              <Icon size={16} />
            </div>
            <p className="text-2xl font-bold tracking-tight text-white mt-4">{value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{hint}</p>
          </div>
        ))}
      </div>

      {/* Probes Table */}
      <div className="rounded-xl border border-[#2b3036] bg-[#181b1f] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2b3036] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Active Vantage Locations</h2>
          <span className="text-xs text-slate-500">Outbound HTTPS polling protocol</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2b3036] bg-[#141618] text-slate-400">
                <th className="px-5 py-3 font-medium">Probe / Name</th>
                <th className="px-5 py-3 font-medium">Configured Region</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Last Heartbeat</th>
                <th className="px-5 py-3 font-medium">In-Flight Leases</th>
                {isAdmin && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b3036]/60">
              {probes.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-5 py-8 text-center text-slate-500">
                    No probes registered yet. Deploy probe containers or click &quot;Enroll New Probe&quot;.
                  </td>
                </tr>
              ) : (
                probes.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.id}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">
                        <Globe size={11} className="text-teal-400" />
                        {p.region}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                        p.status === 'ONLINE'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : p.status === 'REVOKED'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-slate-700/30 border-slate-700 text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'ONLINE' ? 'bg-emerald-400' : p.status === 'REVOKED' ? 'bg-rose-400' : 'bg-slate-500'}`} />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono">{p.version || '1.0.0'}</td>
                    <td className="px-5 py-4 text-slate-400">
                      {p.lastHeartbeatAt ? (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock size={12} className="text-slate-500" />
                          {new Date(p.lastHeartbeatAt).toLocaleTimeString()}
                        </div>
                      ) : (
                        <span className="text-slate-600">Never</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-300 tabular-nums">{p.activeLeases ?? 0}</td>
                    {isAdmin && (
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleRotate(p.id)}
                          className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Rotate API Token"
                        >
                          Rotate
                        </button>
                        {!p.isRevoked && (
                          <button
                            onClick={() => handleRevoke(p.id)}
                            className="px-2.5 py-1 text-[11px] rounded bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition"
                            title="Revoke Token"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#2b3036] bg-[#181b1f] p-6 text-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-[#2b3036] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key size={16} className="text-teal-400" /> Enroll New Monitoring Probe
              </h3>
              <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {enrolledResult ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  Probe <strong>{enrolledResult.probe.name}</strong> successfully enrolled!
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Probe Secret Token (Save now - will not be displayed again):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={enrolledResult.rawToken}
                      className="w-full bg-[#101214] border border-[#2b3036] rounded px-3 py-2 text-xs font-mono text-teal-300 select-all"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(enrolledResult.rawToken);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="rounded bg-slate-900 border border-slate-800 p-3 text-[11px] text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-200">Container Run Command:</p>
                  <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap">
{`docker run -d \\
  -e COORDINATOR_URL=https://netscope.yourdomain.com \\
  -e PROBE_TOKEN=${enrolledResult.rawToken} \\
  -e PROBE_REGION=${enrolledResult.probe.region} \\
  netscope-probe:latest`}
                  </pre>
                </div>

                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-xs font-semibold rounded-lg text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnroll} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Probe Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS US-East Worker"
                    value={newProbeName}
                    onChange={e => setNewProbeName(e.target.value)}
                    className="w-full bg-[#101214] border border-[#2b3036] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Cloud / Geographic Region Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. us-east-1, eu-central-1"
                    value={newProbeRegion}
                    onChange={e => setNewProbeRegion(e.target.value)}
                    className="w-full bg-[#101214] border border-[#2b3036] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Note: A region label is descriptive configuration, not independent proof.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEnrollModal(false)}
                    className="px-3 py-2 text-xs rounded-lg text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Enrolling…' : 'Generate Token & Enroll'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
