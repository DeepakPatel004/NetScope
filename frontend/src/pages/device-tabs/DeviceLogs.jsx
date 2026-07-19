import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function DeviceLogs() {
  const { healthHistory } = useOutletContext();

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-zinc-800/80">
        <div>
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest font-mono">Recent Health Audit Ledger</h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Chronological trace of health auditing loops.</p>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Last 50 Sweeps</span>
      </div>

      {healthHistory.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800/80 pb-2">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Latency</th>
                <th className="pb-3 font-semibold">Return Code</th>
                <th className="pb-3 font-semibold">Datagram Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/55">
              {healthHistory.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-950/30">
                  <td className="py-3 text-zinc-300">{new Date(log.checkedAt).toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      log.status === 'UP' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-300 font-semibold">{log.latency ?? 0} ms</td>
                  <td className="py-3 text-zinc-300 font-semibold">{log.responseCode || '---'}</td>
                  <td className="py-3 text-zinc-400 truncate max-w-sm">{log.message || 'Success'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-xs font-mono text-zinc-500 py-8 text-center">
          NO DETAILED AUDIT RECORDS LOGGED
        </div>
      )}
    </div>
  );
}
