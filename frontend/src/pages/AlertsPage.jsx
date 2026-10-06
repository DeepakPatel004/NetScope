import React, { useState, useEffect } from 'react';
import { Bell, Mail, ShieldAlert, CheckCircle2, Save } from 'lucide-react';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function AlertsPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [minSeverity, setMinSeverity] = useState('HIGH');
  const [notifyCritical, setNotifyCritical] = useState(true);
  const [notifySerious, setNotifySerious] = useState(true);
  const [notifyResolved, setNotifyResolved] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      toast.info(`Sending test alert email to ${email || 'configured address'}...`);
      const res = await api.post('/notifications/test-email', { email });
      if (res.data?.success) {
        toast.success(`Test email delivered successfully to ${res.data.data.recipient}!`);
      } else {
        toast.error('Failed to send test email: ' + (res.data?.message || 'Unknown error'));
      }
    } catch (err) {
      toast.error('SMTP Delivery Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setTestingEmail(false);
    }
  };

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const [prefsRes, notifRes] = await Promise.all([
          api.get('/notifications/preferences').catch(() => ({ data: { data: null } })),
          api.get('/notifications').catch(() => ({ data: { data: [] } }))
        ]);

        const p = prefsRes.data?.data;
        if (p) {
          if (p.email) setEmail(p.email);
          if (p.minSeverity) setMinSeverity(p.minSeverity);
          if (p.notifyCritical !== undefined) setNotifyCritical(p.notifyCritical);
          if (p.notifyAnomaly !== undefined) setNotifySerious(p.notifyAnomaly);
          if (p.notifyRecovery !== undefined) setNotifyResolved(p.notifyRecovery);
        }
        setNotifications(notifRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load alert preferences', err);
      }
    };
    loadPrefs();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put('/notifications/preferences', {
        email,
        minSeverity,
        notifyCritical,
        notifyAnomaly: notifySerious,
        notifyRecovery: notifyResolved,
      });
      toast.success('Notification preferences updated successfully');
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-10 bg-[#101214] min-h-screen text-slate-100 space-y-10 max-w-[1500px] mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2b3036] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Bell size={28} className="text-teal-400" />
            <h1 className="text-2xl md:text-3xl font-semibold text-white font-sans tracking-tight">
              Notifications
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Configure email delivery rules for high-confidence operational incidents and critical downtime events
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* 1. NOTIFICATION CHANNELS */}
        <div className="bg-[#181b1f] border border-[#2b3036] rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
          <h2 className="text-base font-bold text-white uppercase font-sans tracking-wider flex items-center gap-2">
            <Mail size={18} className="text-teal-400" /> NOTIFICATION CHANNELS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs">
            <div className="space-y-2">
              <label className="text-slate-400 font-bold uppercase text-[11px] block">Operator Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sre-operator@company.com"
                className="w-full bg-[#101214] border border-[#2b3036] text-slate-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-teal-500"
              />
              <span className="text-[11px] text-slate-500 block">Recipient address for instant incident alert dispatches</span>
            </div>

            <div className="p-4 bg-[#101214] border border-[#2b3036] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-white font-bold text-sm block">Email Alerts Channel</span>
                <span className="text-slate-400 text-xs">Active SMTP alert delivery engine</span>
              </div>
              <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg text-xs">
                ● ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* 2. MINIMUM SEVERITY */}
        <div className="bg-[#181b1f] border border-[#2b3036] rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
          <h2 className="text-base font-bold text-white uppercase font-sans tracking-wider flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-400" /> MINIMUM NOTIFICATION SEVERITY
          </h2>

          <p className="text-xs text-slate-400 font-sans">
            Select the minimum severity threshold required to trigger immediate email alerts:
          </p>

          <div className="flex flex-wrap gap-4 font-sans text-xs">
            {['MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => (
              <button
                type="button"
                key={sev}
                onClick={() => setMinSeverity(sev)}
                className={`px-5 py-3 rounded-xl font-bold uppercase transition cursor-pointer border ${
                  minSeverity === sev
                    ? 'bg-teal-600 border-teal-500 text-white shadow-sm '
                    : 'bg-[#101214] border-[#2b3036] text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev === 'HIGH' ? '● HIGH (Recommended)' : sev}
              </button>
            ))}
          </div>
        </div>

        {/* 3. EVENT SUBSCRIPTIONS */}
        <div className="bg-[#181b1f] border border-[#2b3036] rounded-xl p-6 md:p-8 space-y-6 shadow-sm font-sans text-xs">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">NOTIFY ME WHEN:</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 bg-[#101214] border border-[#2b3036] rounded-xl cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={notifySerious}
                onChange={(e) => setNotifySerious(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-white font-bold text-sm block">☑ Serious Incident Created</span>
                <span className="text-slate-400 text-xs">Correlated multi-signal operational problem detected</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-[#101214] border border-[#2b3036] rounded-xl cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={notifyCritical}
                onChange={(e) => setNotifyCritical(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-white font-bold text-sm block">☑ Critical Downtime Outage</span>
                <span className="text-slate-400 text-xs">Target endpoint unreachable or service down</span>
              </div>
            </label>
          </div>

          <div className="pt-2 flex items-center gap-3 flex-wrap font-sans text-xs">
            <button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm  disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? 'Saving Settings...' : 'Save Notification Preferences'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm  disabled:opacity-50"
            >
              <Mail size={16} />
              <span>{testingEmail ? 'Sending Test Email...' : '✉ Send Test Email Alert'}</span>
            </button>
          </div>
        </div>

      </form>

      {/* 4. NOTIFICATION HISTORY TABLE */}
      <div className="bg-[#181b1f] border border-[#2b3036] rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
        <h2 className="text-base font-bold text-white uppercase font-sans tracking-wider">NOTIFICATION HISTORY LOG</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-[#2b3036] text-slate-400 font-sans text-[11px] uppercase tracking-wider">
                <th className="py-4 px-4 font-bold">Time</th>
                <th className="py-4 px-4 font-bold">Severity</th>
                <th className="py-4 px-4 font-bold">Event Message</th>
                <th className="py-4 px-4 font-bold text-right">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b3036]/60 text-slate-200 font-sans">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500 font-sans">
                    No alert notifications dispatched yet.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr key={n.id} style={{ height: '56px' }}>
                    <td className="py-4 px-4 text-slate-400">{new Date(n.sentAt).toLocaleString()}</td>
                    <td className="py-4 px-4 font-bold text-amber-400">{n.severity || 'HIGH'}</td>
                    <td className="py-4 px-4 text-white font-bold">{n.message || n.title}</td>
                    <td className="py-4 px-4 text-right text-emerald-400 font-bold">Sent (Email)</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
