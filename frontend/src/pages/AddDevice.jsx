import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Radio, Globe } from 'lucide-react';
import { deviceService } from '../services/device.service.js';
import api from '../services/api.js';

export default function AddDevice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    host: '',
    type: 'WEBSITE',
    interval: 30,
    timeoutMs: 10000,
    selectedProbes: [],
    enabled: true,
  });
  const [availableProbes, setAvailableProbes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch available probes in fleet
    api.get('/probes/fleet')
      .then(res => setAvailableProbes(res.data?.data?.probes || []))
      .catch(() => setAvailableProbes([]));

    if (!id) return;
    let active = true;
    deviceService.getDeviceById(id).then(response => {
      if (active) {
        const device = response.data;
        setForm({
          name: device.name,
          host: device.host,
          type: device.type,
          interval: device.interval,
          timeoutMs: device.timeoutMs || 10000,
          selectedProbes: Array.isArray(device.selectedProbes) ? device.selectedProbes : [],
          enabled: device.enabled,
        });
      }
    }).catch(() => {
      if (active) setError('Could not load this monitor.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  const change = event => {
    const { name, type, value, checked } = event.target;
    setForm(values => ({ ...values, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleProbe = (probeId) => {
    setForm(values => {
      const current = values.selectedProbes || [];
      const updated = current.includes(probeId)
        ? current.filter(p => p !== probeId)
        : [...current, probeId];
      return { ...values, selectedProbes: updated };
    });
  };

  const save = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        host: form.host.trim(),
        interval: Number(form.interval),
        timeoutMs: Number(form.timeoutMs),
      };
      const response = id ? await deviceService.updateDevice(id, payload) : await deviceService.createDevice(payload);
      navigate(`/devices/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the monitor. Please retry.');
    } finally {
      setBusy(false);
    }
  };

  const fieldClass = 'mt-2 w-full rounded-lg border border-[#2b3036] bg-[#101214] px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500';

  return (
    <div className="max-w-2xl mx-auto p-5 sm:p-8 text-slate-100 space-y-7">
      <Link to="/devices" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition">
        <ArrowLeft size={14} /> Back to Monitors
      </Link>
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">{id ? 'Edit Monitor' : 'Create Endpoint Monitor'}</h1>
        <p className="text-xs text-slate-400 mt-1.5">
          Configure external HTTP/HTTPS health checks executed from independent vantage probes.
        </p>
      </header>

      {error && <p role="alert" className="text-xs text-rose-300 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">{error}</p>}

      {loading ? (
        <p role="status" className="text-xs text-slate-400">Loading monitor…</p>
      ) : (
        <form onSubmit={save} className="rounded-xl border border-[#2b3036] bg-[#181b1f] p-6 space-y-5 text-xs">
          <label className="block text-slate-300 font-medium">
            Monitor Name
            <input
              name="name"
              value={form.name}
              onChange={change}
              required
              maxLength={100}
              placeholder="e.g. Production Payment Gateway"
              className={fieldClass}
            />
          </label>

          <label className="block text-slate-300 font-medium">
            Target Endpoint URL
            <input
              name="host"
              value={form.host}
              onChange={change}
              required
              placeholder="https://api.example.com/health"
              className={fieldClass}
            />
            <span className="block mt-1.5 text-[11px] text-slate-500">
              Target destination is protected by execution-time SSRF validation (RFC1918 and cloud metadata blocked).
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-slate-300 font-medium">
              Check Interval (seconds)
              <input
                name="interval"
                type="number"
                min="5"
                max="86400"
                value={form.interval}
                onChange={change}
                required
                className={fieldClass}
              />
            </label>

            <label className="block text-slate-300 font-medium">
              Timeout (milliseconds)
              <input
                name="timeoutMs"
                type="number"
                min="1000"
                max="30000"
                value={form.timeoutMs}
                onChange={change}
                required
                className={fieldClass}
              />
            </label>
          </div>

          {/* Probe Selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-2 flex items-center gap-1.5">
              <Radio size={14} className="text-teal-400" /> Assigned Monitoring Probes
            </label>
            <p className="text-[11px] text-slate-500 mb-3">
              Select specific probe locations, or leave unselected to monitor from all active fleet locations automatically.
            </p>

            {availableProbes.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No probes enrolled yet. Will use all future probes.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableProbes.map(p => {
                  const isChecked = (form.selectedProbes || []).includes(p.id) || (form.selectedProbes || []).includes(p.region);
                  return (
                    <label
                      key={p.id}
                      onClick={() => toggleProbe(p.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                        isChecked
                          ? 'border-teal-500/50 bg-teal-500/10 text-white'
                          : 'border-[#2b3036] bg-[#141618] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by label click
                        className="rounded accent-teal-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Globe size={10} /> {p.region}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 text-slate-300 font-medium pt-2">
            <input
              name="enabled"
              type="checkbox"
              checked={form.enabled}
              onChange={change}
              className="accent-teal-500"
            />
            Enable active scheduling
          </label>

          <div className="flex justify-end gap-3 border-t border-[#2b3036] pt-5">
            <Link to="/devices" className="px-4 py-2 text-xs text-slate-400 hover:text-white">Cancel</Link>
            <button
              disabled={busy}
              className="rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 transition"
            >
              {busy ? 'Saving…' : id ? 'Save Monitor' : 'Create Monitor'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
