import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS) || 6000;

const client = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const aiClient = {
  async generateContent(prompt, context = {}) {
    try {
      const response = await client.post('/explain-insight', {
        prompt,
        kind: context.kind || 'general',
        device_name: context.device?.name || 'Service',
        device_host: context.device?.host || 'localhost',
        telemetry: context
      });
      return response.data;
    } catch (error) {
      console.warn(`[aiClient] explain-insight call failed (${error.message}). Returning null fallback.`);
      return null;
    }
  },

  async detectAnomaly(device, historyLogs = []) {
    try {
      const payload = {
        device_id: device.id,
        device_name: device.name || 'Unknown Device',
        device_host: device.host || 'localhost',
        history: historyLogs.map((log) => ({
          timestamp: log.checkedAt ? new Date(log.checkedAt).toISOString() : new Date().toISOString(),
          status: log.status,
          latency: log.latency || 0,
          dns_time: log.dnsTime || 0,
          tcp_time: log.tcpTime || 0,
          tls_time: log.tlsTime || 0,
          ttfb_time: log.ttfbTime || 0,
          response_code: log.responseCode || null,
          message: log.message || null,
        })),
      };

      const response = await client.post('/detect-anomaly', payload);
      return response.data;
    } catch (error) {
      console.warn(`[aiClient] Anomaly detection call failed (${error.message}). Falling back to normal status.`);
      return {
        is_anomaly: false,
        anomaly_score: 0.0,
        severity: 'LOW',
        detection_reason: 'AI microservice unavailable; operating in fallback monitoring mode.',
        metrics_evaluated: {},
      };
    }
  },

  async analyzeIncident(device, anomalyScore, severity, detectionReason, recentLogs = [], baseline = null) {
    try {
      const payload = {
        device_id: device.id,
        device_name: device.name || 'Unknown Device',
        device_host: device.host || 'localhost',
        anomaly_score: anomalyScore || 0.0,
        severity: severity || 'MEDIUM',
        detection_reason: detectionReason || '',
        recent_logs: recentLogs.map((log) => ({
          timestamp: log.checkedAt ? new Date(log.checkedAt).toISOString() : new Date().toISOString(),
          status: log.status,
          latency: log.latency || 0,
          dns_time: log.dnsTime || 0,
          tcp_time: log.tcpTime || 0,
          tls_time: log.tlsTime || 0,
          ttfb_time: log.ttfbTime || 0,
          response_code: log.responseCode || null,
          message: log.message || null,
        })),
        baseline: baseline || null,
      };

      const response = await client.post('/analyze-incident', payload);
      return response.data;
    } catch (error) {
      console.warn(`[aiClient] Incident analysis call failed (${error.message}). Using fallback analysis.`);
      return {
        incident_summary: `Incident on ${device.name || device.host}. ${detectionReason || 'Service degraded.'}`,
        severity: severity || 'MEDIUM',
        observations: [`Device state check failed for host ${device.host}`],
        possible_causes: ['Network unreachable or process terminated'],
        recommended_investigations: ['Check application logs and host connectivity'],
        confidence: 0.8,
      };
    }
  },

  async prioritizeAlert(severity, durationChecks, frequencyErrors, errorRate, consecutiveFailures, affectedService, anomalyScore) {
    try {
      const payload = {
        severity: severity || 'MEDIUM',
        duration_checks: durationChecks || 1,
        frequency_errors: frequencyErrors || 0,
        error_rate: errorRate || 0.0,
        consecutive_failures: consecutiveFailures || 0,
        affected_service: affectedService || 'Service',
        anomaly_score: anomalyScore || 0.0,
      };

      const response = await client.post('/prioritize-alert', payload);
      return response.data;
    } catch (error) {
      console.warn(`[aiClient] Alert prioritization call failed (${error.message}). Using fallback severity.`);
      return {
        priority: severity || 'MEDIUM',
        priority_score: 5.0,
        priority_reason: 'Fallback priority assigned due to AI service timeout.',
      };
    }
  },

  async summarizeTimeline(deviceName, logs = [], startTime = null, endTime = null) {
    try {
      const payload = {
        device_name: deviceName || 'Service',
        logs: logs.map((log) => ({
          timestamp: log.checkedAt ? new Date(log.checkedAt).toISOString() : new Date().toISOString(),
          status: log.status,
          latency: log.latency || 0,
          dns_time: log.dnsTime || 0,
          tcp_time: log.tcpTime || 0,
          tls_time: log.tlsTime || 0,
          ttfb_time: log.ttfbTime || 0,
          response_code: log.responseCode || null,
          message: log.message || null,
        })),
        start_time: startTime,
        end_time: endTime,
      };

      const response = await client.post('/summarize-timeline', payload);
      return response.data;
    } catch (error) {
      console.warn(`[aiClient] Timeline summary call failed (${error.message}). Returning basic fallback.`);
      return {
        timeline_summary: `Telemetry logs recorded for ${deviceName}.`,
        key_events: logs.filter((l) => l.status === 'DOWN').map((l) => `Down status logged at ${l.checkedAt}`),
      };
    }
  },

  async generatePlaybook(deviceName, deviceHost, deviceType, incidentSummary, possibleCauses = []) {
    try {
      const payload = {
        device_name: deviceName || 'Service',
        device_host: deviceHost || 'localhost',
        device_type: deviceType || 'WEBSITE',
        incident_summary: incidentSummary || 'Telemetry degradation',
        possible_causes: possibleCauses,
      };

      const response = await client.post('/generate-playbook', payload);
      return response.data;
    } catch (error) {
      console.warn(`[aiClient] Playbook call failed (${error.message}). Returning fallback playbook.`);
      return {
        playbook_title: `SRE Incident Remediation Playbook — ${deviceName}`,
        estimated_recovery_mins: 5,
        cli_commands: [
          `curl -Iv http://${deviceHost}`,
          `ping -c 4 ${deviceHost}`,
          `docker ps --filter name=${(deviceName || 'app').toLowerCase().replace(/\s+/g, '-')}`,
          `systemctl status network-manager`
        ],
        remediation_steps: [
          `Execute socket connectivity ping against target host '${deviceHost}'`,
          `Review systemctl and container execution logs for process crashes`,
          `Flush local DNS resolver cache and verify gateway firewall rules`,
          `Restart application service process if memory limit is exceeded`
        ]
      };
    }
  }
};
