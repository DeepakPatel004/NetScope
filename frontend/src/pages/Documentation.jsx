import { Link } from 'react-router-dom';
export default function Documentation() {
  const sections = [
    ['1. Add an endpoint', 'Configure an HTTP or HTTPS URL reachable from the monitoring probes. Localhost on a probe refers to that probe, not your laptop.'],
    ['2. Compare observations', 'Review status, latency and connection timings for each probe. Empty history means no observations have been collected yet.'],
    ['3. Investigate incidents', 'The verifier compares target and control observations to assess widespread failures, location-specific failures and suspected probe connectivity problems. Assessments describe evidence, not a guaranteed root cause.'],
    ['4. Inspect TLS evidence', 'The TLS evidence tab shows certificate details available from probe observations. Missing metadata means no certificate evidence is available for that observation.'],
    ['5. Understand location labels', 'Local Compose probes simulate locations on one machine. Real location diversity requires independently deployed probes.'],
  ];
  return <div className="max-w-3xl mx-auto p-5 sm:p-8 text-slate-100 space-y-8"><header className="border-b border-[#2b3036] pb-6"><h1 className="text-2xl font-semibold">Documentation</h1><p className="text-sm text-slate-400 mt-2">Endpoint monitoring without host agents or automated restarts.</p></header>{sections.map(([title, description]) => <section key={title}><h2 className="font-semibold mb-3">{title}</h2><p className="text-sm text-slate-400 leading-relaxed">{description}</p></section>)}<Link to="/devices/new" className="inline-block rounded-lg bg-teal-700 px-4 py-2 text-sm">Add a device</Link></div>;
}
