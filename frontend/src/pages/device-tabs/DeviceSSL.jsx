import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function DeviceSSL() {
  const {
    sslInfo,
    sslChecking,
    handleManualSSLCheck,
    formatDate
  } = useOutletContext();

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest font-mono">SSL Security Certificate Status</h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">TLS handshake verification credentials.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {sslInfo && (
            <span className={`text-xs font-bold font-mono px-3.5 py-1 rounded-full border ${
              sslInfo.status === 'VALID'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : sslInfo.status === 'EXPIRING'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {sslInfo.status === 'VALID' && `✅ Valid (Expires in ${sslInfo.daysRemaining} Days)`}
              {sslInfo.status === 'EXPIRING' && `⚠ Expiring (Expires in ${sslInfo.daysRemaining} Days)`}
              {sslInfo.status === 'EXPIRED' && `❌ Expired`}
              {sslInfo.status === 'INVALID' && `❌ Invalid Certificate`}
            </span>
          )}
          <button
            onClick={handleManualSSLCheck}
            disabled={sslChecking}
            className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 disabled:opacity-50 px-3 py-1.5 rounded-xl text-xs font-mono transition-all"
          >
            <Shield size={10} className="text-indigo-400" />
            {sslChecking ? 'SCANNING...' : 'SCAN SSL'}
          </button>
        </div>
      </div>

      {sslInfo ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-sm">
          <div className="space-y-4">
            <div>
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Subject Common Name (Domain)</div>
              <div className="text-sm font-semibold text-white mt-1.5 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/85">
                {sslInfo.subject || 'N/A'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Authority Issuer</div>
                <div className="text-sm font-semibold text-white mt-1.5 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/85 truncate">
                  {sslInfo.issuer || 'Self-Signed'}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Serial Number</div>
                <div className="text-sm font-semibold text-white mt-1.5 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/85 truncate select-all">
                  {sslInfo.serialNumber || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Validity Schedule</div>
              <div className="text-sm font-semibold text-white mt-1.5 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/85">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Issued On:</span>
                  <span>{formatDate(sslInfo.validFrom)}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-zinc-800/85">
                  <span className="text-zinc-400">Expires On:</span>
                  <span>{formatDate(sslInfo.validTo)}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Signature Certificate Fingerprint</div>
              <div className="text-xs font-semibold text-zinc-300 mt-1.5 break-all bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/85 leading-relaxed">
                {sslInfo.fingerprint || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm font-mono text-zinc-500 py-12 text-center border border-dashed border-zinc-800/80 rounded-xl">
          NO ACTIVE SSL/TLS CERTIFICATE LOGS AVAILABLE FOR THIS ENDPOINT
        </div>
      )}
    </div>
  );
}
