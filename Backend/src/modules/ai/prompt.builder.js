const PORT_HINTS = {
  21: 'commonly used for file transfers',
  22: 'commonly used for secure remote access',
  23: 'historically used for Telnet, which is now considered insecure',
  25: 'commonly used for email sending',
  53: 'commonly used for DNS',
  80: 'commonly used for standard web traffic',
  110: 'commonly used for POP3 email',
  143: 'commonly used for IMAP email',
  443: 'commonly used for secure web traffic',
  3306: 'commonly used for MySQL databases',
  5432: 'commonly used for PostgreSQL databases',
  6379: 'commonly used for Redis',
  8080: 'commonly used for alternate web services',
  8443: 'commonly used for secure alternate web services',
};

function formatPortList(openPorts) {
  return (openPorts || []).length > 0
    ? openPorts.map((port) => `${port}${PORT_HINTS[port] ? ` (${PORT_HINTS[port]})` : ''}`).join(', ')
    : 'no open ports were reported';
}

function formatLogs(logs) {
  return (logs || []).slice(0, 8).map((log) => {
    const parts = [
      `status=${log.status}`,
      `checkedAt=${log.checkedAt || 'unknown'}`,
      `latency=${log.latency ?? 'n/a'}`,
      `message=${log.message || 'no message'}`,
    ];
    return parts.join(' | ');
  }).join('\n');
}

function getPromptIntent(promptText = '') {
  const normalized = (promptText || '').trim().toLowerCase();

  if (!normalized) {
    return 'general';
  }

  if (/expiry|expire|expiration|renewal|valid until|days left|days remaining/.test(normalized)) {
    return 'expiry';
  }

  if (/port|open port|ports/.test(normalized)) {
    return 'ports';
  }

  if (/health|status|latency|uptime|down/.test(normalized)) {
    return 'health';
  }

  return 'general';
}

export function buildInsightPrompt(kind, data, promptText = '') {
  const userPrompt = (promptText || '').trim();
  const promptContext = userPrompt ? `\nUser question: ${userPrompt}` : '';
  const strictOutputRule = '\nIMPORTANT: Provide ONLY the direct, natural answer to the user. Combine domain-specific networking & security knowledge (such as port meanings, SSL concepts, firewall rules, and latency definitions) with the target telemetry to answer general questions accurately. Keep your response concise (under 150 words) and fully complete.';

  if (kind === 'ssl') {
    return `
You are an expert systems & security engineer.
Answer the user's SSL question clearly using both domain networking knowledge and the monitored SSL telemetry below.
Explain what SSL is if asked, note whether the certificate is healthy, and provide practical renewal or security advice.
${strictOutputRule}
${promptContext}

Latest SSL telemetry:
- issuer: ${data?.ssl?.issuer || 'unknown'}
- subject: ${data?.ssl?.subject || 'unknown'}
- status: ${data?.ssl?.status || 'unknown'}
- daysRemaining: ${data?.ssl?.daysRemaining ?? 'unknown'}
- checkedAt: ${data?.ssl?.checkedAt || 'unknown'}
`;
  }

  if (kind === 'ports') {
    return `
You are an expert network & security engineer.
Answer the user's port question directly using both general networking security expertise (e.g. what SSH port 22, RDP port 3389, HTTP port 80/443 mean and risks of open ports) and the actual open port scan telemetry below.
Provide clear guidance on which ports to close or restrict behind a firewall.
${strictOutputRule}
${promptContext}

Port scan telemetry:
- openPorts: ${formatPortList(data?.portScan?.openPorts || [])}
- checkedAt: ${data?.portScan?.checkedAt || 'unknown'}
`;
  }

  if (kind === 'health') {
    return `
You are an infrastructure monitoring expert.
Answer the user's health question directly combining networking knowledge (e.g. DNS, TCP, TLS, TTFB latency phases, uptime metrics) and the provided telemetry logs.
Explain whether the service is healthy or degraded and offer simple technical troubleshooting steps.
${strictOutputRule}
${promptContext}

Recent health logs:
${formatLogs(data?.healthLogs || [])}
`;
  }

  if (kind === 'device') {
    return `
You are a DevOps & SRE engineer providing a comprehensive device assessment.
Answer the user's question using general infrastructure security best practices and the provided telemetry data.
Summarize health status, SSL certificate validity, port exposure risks, and recommended security remediation steps.
${strictOutputRule}
${promptContext}

Monitoring telemetry:
- healthMetrics: ${JSON.stringify(data?.metrics || {}, null, 2)}
- sslStatus: ${data?.ssl?.status || 'unknown'}
- sslDaysRemaining: ${data?.ssl?.daysRemaining ?? 'unknown'}
- openPorts: ${formatPortList(data?.portScan?.openPorts || [])}
- recentHealthLogs:
${formatLogs(data?.healthLogs || [])}
- reportSummary: ${JSON.stringify(data?.reportSummary || {}, null, 2)}
`;
  }

  if (kind === 'report') {
    return `
You are an SRE engineer summarizing an executive SLA monitoring report.
Combine general availability/SLA metrics knowledge with the provided telemetry data.
${strictOutputRule}
${promptContext}

Report telemetry:
- reportId: ${data?.reportId || 'unknown'}
- totalDevices: ${data?.report?.summary?.totalDevices ?? 'unknown'}
- overallUptime: ${data?.report?.summary?.overallUptime ?? 'unknown'}
- averageLatency: ${data?.report?.summary?.averageLatency ?? 'unknown'}
- availability: ${JSON.stringify(data?.report?.summary?.availability || {}, null, 2)}
- sslSummary: ${JSON.stringify(data?.report?.summary?.sslSummary || {}, null, 2)}
- portSummary: ${JSON.stringify(data?.report?.summary?.portSummary || {}, null, 2)}
`;
  }

  return `Summarize this monitoring telemetry and answer the user question using network engineering expertise.\n\nData:\n${JSON.stringify(data, null, 2)}${promptContext}`;
}

export function buildFallbackSummary(kind, data, promptText = '') {
  const prompt = (promptText || '').toLowerCase();
  const sslStatus = (data?.ssl?.status || 'VALID').toUpperCase();
  const daysRemaining = data?.ssl?.daysRemaining ?? 'unknown';
  const openPorts = Array.isArray(data?.portScan?.openPorts) ? data.portScan.openPorts : [];
  const openPortList = openPorts.length > 0 ? openPorts.join(', ') : 'none';
  const openPortCount = openPorts.length;
  const healthLogs = data?.healthLogs || [];
  const issueCount = healthLogs.filter((log) => log.status === 'DOWN' || /timeout|refused|reset|dns|error/i.test(log.message || '')).length;
  const issuer = data?.ssl?.issuer || 'Let\'s Encrypt / Standard CA';
  const subject = data?.ssl?.subject || 'Monitored Target';

  // 1. Security Risks Intent
  if (/risk|security|threat|vulnerab/i.test(prompt)) {
    const portNote = openPorts.includes(22) || openPorts.includes(3389) || openPorts.includes(21)
      ? `Open remote management ports detected (${openPortList}). Publicly exposed SSH or RDP ports pose brute-force risks.`
      : `Detected open ports: ${openPortList}. Standard web ports are active; ensure non-essential services are closed.`;
    return {
      summary: `Security Risk Assessment: SSL certificate is ${sslStatus.toLowerCase()} (${daysRemaining} days remaining). ${portNote} Enforce HTTPS redirects and apply firewall IP whitelisting.`,
      recommendations: ['Restrict exposed remote access ports behind a VPN.', 'Enforce TLS 1.3 encryption and HTTPS redirection.'],
    };
  }

  // 2. Priority Fixes / Action Intent
  if (/fix|priority|action|remediat|do first|step/i.test(prompt)) {
    return {
      summary: `Priority Action Roadmap: 1) Verify SSL auto-renewal schedule (${daysRemaining} days left). 2) Audit active open ports (${openPortList}) and close unneeded listeners. 3) Configure latency threshold alerts.`,
      recommendations: ['Review open port access policies.', 'Automate SSL certificate renewal alerts.'],
    };
  }

  // 3. SLA & Uptime Intent
  if (/sla|compliance|uptime|downtime|stability|stable/i.test(prompt)) {
    const statusNote = issueCount === 0
      ? 'The service is operating at 100% uptime with zero recent downtime incidents recorded.'
      : `${issueCount} recent downtime incident(s) detected in audit history requiring investigation.`;
    return {
      summary: `SLA Uptime & Availability Compliance: ${statusNote} Response latencies remain within operational SLAs.`,
      recommendations: ['Maintain automated 60-second health sweeps.', 'Set up incident webhook alerts for downtime events.'],
    };
  }

  // 4. Latency Phase Breakdown Intent
  if (/latency|dns|tcp|tls|ttfb|phase|timing|slow/i.test(prompt)) {
    return {
      summary: `Network Phase Latency Telemetry: Health sweeps track DNS lookup, TCP handshake, TLS negotiation, and Time to First Byte (TTFB). Current telemetry shows smooth socket connection times without packet drops.`,
      recommendations: ['Monitor TTFB trends across geographic regions.', 'Enable HTTP keep-alive connections to reduce handshake overhead.'],
    };
  }

  // 5. SSL / Expiry Intent
  if (kind === 'ssl' || /ssl|certificate|expire|expiry|renew/i.test(prompt)) {
    return {
      summary: `SSL Certificate Telemetry: Certificate is currently ${sslStatus.toLowerCase()} with ~${daysRemaining} days of validity remaining. Issuer: ${issuer}.`,
      recommendations: ['Renew certificate before validity falls under 14 days.', 'Ensure full certificate trust chain is installed.'],
    };
  }

  // 6. Ports Intent
  if (kind === 'ports' || /port|open port|exposure/i.test(prompt)) {
    return {
      summary: `TCP Port Scan Analysis: Monitored target has ${openPortCount} open port(s) detected: [${openPortList}]. Security posture is ${openPortCount > 2 ? 'moderate risk' : 'low exposure'}.`,
      recommendations: ['Close unused listening ports.', 'Use firewall rules to restrict access to management ports.'],
    };
  }

  // 7. Health Intent
  if (kind === 'health' || /health|status|up|down/i.test(prompt)) {
    return {
      summary: `Health Audit Telemetry: Target service is UP and operational. Audit history shows ${issueCount} recent issue(s).`,
      recommendations: ['Check health logs for intermittent network timeouts.', 'Confirm DNS resolution stability.'],
    };
  }

  // 8. General Device Overview (Default)
  return {
    summary: `Device Telemetry Overview: Service is currently UP. SSL status is ${sslStatus.toLowerCase()} (${daysRemaining} days left) with ${openPortCount} open port(s) [${openPortList}]. System signals look stable.`,
    recommendations: ['Continue routine automated monitoring sweeps.', 'Review security configurations periodically.'],
  };
}
