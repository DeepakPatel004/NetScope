import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function DeviceLogs() {
  const { healthHistory = [] } = useOutletContext() || {};
  const safeLogs = Array.isArray(healthHistory) ? healthHistory : [];

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-200/80">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide font-sans">Recent Health Audit Ledger</h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">Chronological trace of health auditing loops.</p>
        </div>
        <span className="text-[10px] text-slate-500 font-sans uppercase tracking-wide">Last 50 Sweeps</span>
      </div>

      {safeLogs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200/80 pb-2">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Latency</th>
                <th className="pb-3 font-semibold">Return Code</th>
                <th className="pb-3 font-semibold">Datagram Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/55">
              {safeLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/30">
                  <td className="py-3 text-slate-700">{new Date(log.checkedAt).toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      log.status === 'UP' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-700 border border-rose-500/10'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-700 font-semibold">{log.latency ?? 0} ms</td>
                  <td className="py-3 text-slate-700 font-semibold">{log.responseCode || '---'}</td>
                  <td className="py-3 text-slate-600 truncate max-w-sm">{log.message || 'Success'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-xs font-sans text-slate-500 py-8 text-center">
          NO DETAILED AUDIT RECORDS LOGGED
        </div>
      )}
    </div>
  );
}
