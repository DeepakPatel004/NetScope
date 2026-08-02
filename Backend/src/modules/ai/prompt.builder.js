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

  if (kind === 'ssl') {
    return `
You are helping a non-technical user understand a monitoring result.
Explain the SSL status in simple English and make it feel conversational.
Mention what SSL is, whether the certificate looks healthy, and whether the user should take action.
Keep the answer short, practical, and specific to the current data.
Avoid sounding like a template. Lead with the most important finding first.
Use the user question as context and adapt the wording.
${promptContext}

Latest SSL data:
- issuer: ${data?.ssl?.issuer || 'unknown'}
- subject: ${data?.ssl?.subject || 'unknown'}
- status: ${data?.ssl?.status || 'unknown'}
- daysRemaining: ${data?.ssl?.daysRemaining ?? 'unknown'}
- checkedAt: ${data?.ssl?.checkedAt || 'unknown'}
`;
  }

  if (kind === 'ports') {
    return `
Explain the port scan results for a beginner in clear, everyday language.
Describe what each open port is commonly used for and mention simple security concerns.
Be specific to the actual open ports and avoid generic wording.
Mention whether the exposure looks low, medium, or high based on the ports that are open.
${promptContext}

Port scan data:
- openPorts: ${formatPortList(data?.portScan?.openPorts || [])}
- checkedAt: ${data?.portScan?.checkedAt || 'unknown'}
`;
  }

  if (kind === 'health') {
    return `
Answer the user's health question directly using the provided logs only.
Start with the most important finding, then explain it in one short paragraph.
Mention whether the service is currently healthy or degraded, and if there are errors, explain them in simple terms.
Do not start with generic phrases like "Here is a plain-English breakdown" or "I can help".
Do not add filler or repeat the same opening phrase.
Use the user's question as context and keep the answer concise but specific.
${promptContext}

Recent health logs:
${formatLogs(data?.healthLogs || [])}
`;
  }

  if (kind === 'device') {
    return `
Summarize the device monitoring status for a non-technical user using the provided data only.
Mention whether the service looks healthy, note any SSL or port concerns, and suggest a few practical improvements if needed.
Be natural, concise, and specific to the current findings. Avoid repeating the same opening phrase every time.
${promptContext}

Monitoring data:
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
Summarize this monitoring report in plain English.
Highlight the most important observations and recommendations.
Keep the explanation beginner-friendly and short, and focus on the biggest risks first.
${promptContext}

Report data:
- reportId: ${data?.reportId || 'unknown'}
- totalDevices: ${data?.report?.summary?.totalDevices ?? 'unknown'}
- overallUptime: ${data?.report?.summary?.overallUptime ?? 'unknown'}
- averageLatency: ${data?.report?.summary?.averageLatency ?? 'unknown'}
- availability: ${JSON.stringify(data?.report?.summary?.availability || {}, null, 2)}
- sslSummary: ${JSON.stringify(data?.report?.summary?.sslSummary || {}, null, 2)}
- portSummary: ${JSON.stringify(data?.report?.summary?.portSummary || {}, null, 2)}
`;
  }

  return `Summarize this monitoring data in simple English. Keep it short and practical.\n\nData:\n${JSON.stringify(data, null, 2)}${promptContext}`;
}

export function buildFallbackSummary(kind, data, promptText = '') {
  const promptIntent = getPromptIntent(promptText);

  if (kind === 'ssl') {
    const status = (data?.ssl?.status || 'UNKNOWN').toUpperCase();
    const daysRemaining = data?.ssl?.daysRemaining;
    const isExpiry = promptIntent === 'expiry';

    let summary = `The current SSL record is ${status.toLowerCase()}.`;

    if (isExpiry) {
      if (daysRemaining != null && daysRemaining <= 14) {
        summary = `The certificate has about ${daysRemaining} days remaining, so renewal is getting urgent.`;
      } else if (daysRemaining != null && daysRemaining <= 45) {
        summary = `The certificate is approaching renewal with about ${daysRemaining} days remaining.`;
      } else if (daysRemaining != null) {
        summary = `The certificate is still valid for about ${daysRemaining} days, so it is not urgent yet.`;
      } else {
        summary = 'The certificate expiry details are available, but the remaining validity window was not reported.';
      }
    } else if (daysRemaining != null) {
      summary = `The certificate is currently ${status.toLowerCase()} and has about ${daysRemaining} days remaining.`;
    }

    return {
      summary,
      recommendations: [
        'Review the certificate validity dates.',
        'Renew the certificate before it expires if the status is expiring or expired.',
      ],
    };
  }

  if (kind === 'ports') {
    const openPorts = Array.isArray(data?.portScan?.openPorts) ? data.portScan.openPorts : [];
    const portList = openPorts.join(', ');
    const portLabel = openPorts.length > 0 ? `${openPorts.length} open port${openPorts.length === 1 ? '' : 's'}` : 'no open ports';
    const riskNote = openPorts.includes(22) || openPorts.includes(3389) || openPorts.includes(21)
      ? ' This looks more exposed because some of the ports are commonly used for remote access or file transfer.'
      : ' The exposure looks moderate, so it is still worth checking whether each service is expected.';

    return {
      summary: `The latest port scan shows ${portLabel}${openPorts.length > 0 ? ` (${portList})` : ''}.${riskNote}`,
      recommendations: [
        'Confirm that each open port is expected.',
        'Close unused or exposed services where possible.',
      ],
    };
  }

  if (kind === 'health') {
    const issueCount = data?.issueCount || 0;
    return {
      summary: `The recent health checks show ${issueCount} issue${issueCount === 1 ? '' : 's'}${issueCount > 0 ? ', so the service is not fully stable right now.' : ', and the service appears stable for now.'}`,
      recommendations: [
        'Check the latest health logs for repeated errors.',
        'Confirm network connectivity and DNS settings.',
      ],
    };
  }

  if (kind === 'device') {
    const sslStatus = (data?.ssl?.status || 'unknown').toUpperCase();
    const openPortCount = data?.portScan?.openPorts?.length || 0;
    const issueCount = data?.healthLogs?.filter((log) => log.status === 'DOWN' || /timeout|refused|reset|dns|error/i.test(log.message || '')).length || 0;
    const highlights = [];

    if (issueCount > 0) highlights.push(`${issueCount} recent issue${issueCount === 1 ? '' : 's'}`);
    if (sslStatus !== 'UNKNOWN') highlights.push(`SSL status ${sslStatus.toLowerCase()}`);
    if (openPortCount > 0) highlights.push(`${openPortCount} open port${openPortCount === 1 ? '' : 's'}`);

    const detail = highlights.length > 0
      ? ` The current signals point to ${highlights.join(', ')}.`
      : ' The current signals look generally stable.';

    return {
      summary: `The device looks mostly healthy, but the recent checks suggest a few follow-ups are worth reviewing.${detail}`,
      recommendations: [
        'Keep monitoring the device closely.',
        'Investigate any recent downtime or certificate issues.',
      ],
    };
  }

  if (kind === 'report') {
    return {
      summary: 'The report shows a mixed picture overall, with availability and security signals that deserve a closer look.',
      recommendations: [
        'Focus on recurring downtime and certificate expiry.',
        'Review open ports and any repeated service errors.',
      ],
    };
  }

  return {
    summary: 'Monitoring data is available, but the latest checks do not show a clear issue yet.',
    recommendations: ['Continue monitoring regularly.', 'Investigate any recurring errors quickly.'],
  };
}
