import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Terminal } from 'lucide-react';

export default function DevicePorts() {
  const {
    portsInfo,
    portsChecking,
    handleManualPortsCheck
  } = useOutletContext();

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <Terminal size={20} className="text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest font-mono">Port Scan Registry</h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">Scanned open TCP listener ports.</p>
          </div>
        </div>
        <button
          onClick={handleManualPortsCheck}
          disabled={portsChecking}
          className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 disabled:opacity-50 px-3 py-1.5 rounded-xl text-xs font-mono transition-all"
        >
          <Terminal size={10} className="text-amber-400" />
          {portsChecking ? 'SCANNING...' : 'SCAN PORTS'}
        </button>
      </div>

      {portsInfo && portsInfo.openPorts.length > 0 ? (
        <div className="flex flex-wrap gap-3 mt-4">
          {portsInfo.openPorts.map((port) => (
            <span
              key={port}
              className="px-4 py-2 bg-zinc-950 border border-zinc-800/85 text-zinc-100 rounded-xl text-xs font-mono tracking-wider font-semibold"
            >
              PORT: {port}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-sm font-mono text-zinc-500 py-8 text-center border border-dashed border-zinc-800/80 rounded-xl">
          ALL SPECIFIED TARGET PORTS SECURE / CLOSED
        </div>
      )}

      {portsInfo && (
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500 uppercase tracking-widest">Last Scanned</span>
          <span className="font-semibold text-zinc-400">
            {new Date(portsInfo.checkedAt).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
