import { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, Pencil, Trash2 } from 'lucide-react';
import api from '../services/api.js';
import { deviceService } from '../services/device.service.js';
import { useToast } from '../context/ToastContext.jsx';

export default function DeviceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const fetchData = useCallback(async signal => {
    try {
      const paths = [`/devices/${id}`, `/dashboard/device/${id}`, `/incidents?deviceId=${id}`];
      const results = await Promise.all(paths.map(path => api.get(path, { signal })));
      const [device, dashboardDetail, incidents] = results.map(response => response.data.data);
      setData({
        device: dashboardDetail?.deviceInfo || device,
        analytics: dashboardDetail?.analytics,
        probeMatrix: dashboardDetail?.probeMatrix || [],
        locationResults: dashboardDetail?.locationResults || [],
        healthHistory: dashboardDetail?.timeline || [],
        incidents,
      });
      setError('');
    } catch (error) { if (error.code !== 'ERR_CANCELED') setError('Could not load this device and its telemetry. Please retry.'); }
  }, [id]);
  useEffect(() => { const controller = new AbortController(); setData(null); fetchData(controller.signal); return () => controller.abort(); }, [fetchData]);
  const check = async kind => {
    setBusy(kind);
    try { await api.post(`/${kind}/check/${id}`); toast.success('Check queued. Refresh shortly to see the result.'); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not queue this check.'); }
    finally { setBusy(''); }
  };
  const remove = async () => { setDeleting(true); try { await deviceService.deleteDevice(id); navigate('/devices'); } catch { toast.error('Could not delete this device.'); setDeleting(false); } };
  const tabs = [['Overview', ''], ['Performance', '/performance'], ['TLS evidence', '/security'], ['Health logs', '/logs']];
  const latest = data?.healthHistory?.[0];
  return <div className="max-w-7xl mx-auto p-5 sm:p-8 text-slate-900 space-y-6">
    <Link to="/devices" className="text-sm text-slate-600">Devices / {data?.device.name || 'Details'}</Link>
    {error && <p role="alert" className="text-rose-700 text-sm">{error} <button onClick={() => fetchData()} className="underline">Retry</button></p>}
    {!data && !error && <p role="status">Loading device…</p>}
    {data && <><header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] pb-6"><div><h1 className="text-2xl font-semibold">{data.device.name}</h1><p className="text-sm text-slate-600 mt-2">{data.device.host} · {latest?.status || 'Unknown'} · {data.device.enabled ? 'Monitoring enabled' : 'Monitoring paused'}</p></div><div className="flex gap-2"><button title="Refresh telemetry" aria-label="Refresh telemetry" onClick={() => fetchData()} className="p-2 text-slate-600"><RefreshCw size={17} /></button><Link to={`/devices/edit/${id}`} className="p-2 text-slate-600" aria-label="Edit device"><Pencil size={17} /></Link><button aria-label="Delete device" onClick={() => setShowDelete(true)} className="p-2 text-slate-600 hover:text-rose-700"><Trash2 size={17} /></button></div></header>
    <nav aria-label="Device sections" className="flex gap-1 flex-wrap border-b border-[#e2e8f0]">{tabs.map(([label, path]) => <NavLink key={path} to={`/devices/${id}${path}`} end={!path} className={({ isActive }) => `px-4 py-3 text-sm border-b-2 ${isActive ? 'border-teal-400 text-slate-900' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>{label}</NavLink>)}</nav>
    <Outlet context={{ ...data, checking: busy === 'health', handleManualCheck: () => check('health'), formatDate: value => value ? new Date(value).toLocaleString() : 'Not recorded' }} />
    </>}
    {showDelete && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="max-w-sm rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-6 space-y-4"><h2 id="delete-title" className="font-semibold">Delete this device?</h2><p className="text-sm text-slate-600">Its monitoring history will also be deleted.</p><div className="flex justify-end gap-3"><button onClick={() => setShowDelete(false)} className="text-sm text-slate-600">Cancel</button><button disabled={deleting} onClick={remove} className="rounded-lg bg-rose-700 px-3 py-2 text-sm text-white">{deleting ? 'Deleting…' : 'Delete device'}</button></div></section></div>}
  </div>;
}
