import { Link } from 'react-router-dom';
export default function Documentation() {
  const sections = [
    ['1. Add an endpoint', 'Choose Website or API for HTTP/HTTPS checks. Choose IP, Server, or Worker for reachability checks. Enter the actual URL, hostname, or IP reachable from the NetScope backend.'],
    ['2. Review health checks', 'Each device records its status, latency, HTTP response code, and available connection timing. An empty history means no checks have been collected yet.'],
    ['3. Investigate anomalies', 'Statistical checks and an Isolation Forest model evaluate latency and failed requests. Persistent high-severity anomalies or repeated failed checks open incidents. Healthy samples allow incidents to resolve. Anomaly scores are not probabilities of a future outage.'],
    ['4. Check certificates and ports', 'Use the Security tab to request an SSL audit or port scan. Certificate status and open ports are shown only after a check has completed.'],
    ['5. Use the assistant', 'Select a device to include recorded health, SSL, and port data with your question. If the AI service is unavailable, NetScope reports that instead of inventing a health assessment.'],
    ['6. Export and notifications', 'Reports summarize the latest recorded checks and can be downloaded as CSV or PDF. Notification preferences control alert severity and service-restored messages.'],
  ];
  return <div className="max-w-3xl mx-auto p-5 sm:p-8 text-slate-100 space-y-8"><header className="border-b border-[#2b3036] pb-6"><h1 className="text-2xl font-semibold">Documentation</h1><p className="text-sm text-slate-400 mt-2">Endpoint monitoring without host agents or automated restarts.</p></header>{sections.map(([title, description]) => <section key={title}><h2 className="font-semibold mb-3">{title}</h2><p className="text-sm text-slate-400 leading-relaxed">{description}</p></section>)}<Link to="/devices/new" className="inline-block rounded-lg bg-teal-700 px-4 py-2 text-sm">Add a device</Link></div>;
}
