import { useOutletContext } from 'react-router-dom';

export default function DeviceSecurity() {
  const { probeMatrix = [] } = useOutletContext() || {};
  return <section className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-6 space-y-5">
    <header><h2 className="text-lg font-semibold">TLS evidence by probe</h2><p className="text-sm text-slate-600 mt-2">Certificate details from recorded HTTPS checks. Missing details do not establish certificate validity.</p></header>
    {!probeMatrix.length && <p className="text-sm text-slate-600">No probe observations recorded yet.</p>}
    <div className="grid gap-4 md:grid-cols-2">{probeMatrix.map(result => {
      const cert = result.tlsCert;
      return <article key={result.probeId} className="border border-[#e2e8f0] rounded-lg p-4 space-y-3 text-sm">
        <h3 className="font-medium">{result.probeName || result.probeId} <span className="text-slate-600">· {result.region}</span></h3>
        <p className="text-slate-600">Observed: {result.observedAt ? new Date(result.observedAt).toLocaleString() : 'Not recorded'}</p>
        {result.failureStage === 'TLS_VERIFICATION' && <p className="text-rose-700">TLS verification failed: {result.message || 'See incident evidence.'}</p>}
        {cert ? <dl className="space-y-2 text-slate-700">
          <div>Subject: {cert.subject || 'Unavailable'}</div><div>Issuer: {cert.issuer || 'Unavailable'}</div>
          <div>Expires: {cert.validTo ? new Date(cert.validTo).toLocaleString() : 'Unavailable'}</div>
          <div>Days remaining: {cert.daysRemaining ?? 'Unavailable'}</div>
          <div>Trust verification: {cert.authorized === true ? 'Passed' : cert.authorized === false ? 'Failed' : 'Unavailable'}</div>
        </dl> : <p className="text-slate-500">No certificate metadata was captured. HTTP checks do not use TLS.</p>}
      </article>;
    })}</div>
  </section>;
}
