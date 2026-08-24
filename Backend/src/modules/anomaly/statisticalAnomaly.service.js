export const statisticalAnomalyService = {
  evaluateLatency(currentLatency, historyLogs = []) {
    if (!currentLatency || historyLogs.length < 5) {
      return { isAnomaly: false, zScore: 0, mean: currentLatency || 0, deviationRatio: 1.0 };
    }

    const latencies = historyLogs.map((l) => l.latency).filter((l) => typeof l === 'number' && l > 0);
    if (latencies.length < 5) {
      return { isAnomaly: false, zScore: 0, mean: currentLatency, deviationRatio: 1.0 };
    }

    const sum = latencies.reduce((a, b) => a + b, 0);
    const mean = sum / latencies.length;
    const variance = latencies.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / latencies.length;
    const stdDev = Math.sqrt(variance) || 1.0;

    const zScore = (currentLatency - mean) / stdDev;
    const deviationRatio = mean > 0 ? currentLatency / mean : 1.0;

    const isAnomaly = zScore > 2.5 || deviationRatio >= 2.5;

    return {
      isAnomaly,
      zScore: Math.min(5.0, Math.max(-5.0, zScore)),
      mean: Math.round(mean),
      stdDev: Math.round(stdDev),
      deviationRatio: Number(deviationRatio.toFixed(2)),
    };
  },

  evaluateServerMetrics(latestMetric) {
    if (!latestMetric) return { isAnomaly: false, reasons: [], maxScore: 0.0 };

    const reasons = [];
    let score = 0.0;

    if (latestMetric.cpuPercent && latestMetric.cpuPercent >= 85.0) {
      reasons.push(`CPU usage elevated to ${latestMetric.cpuPercent.toFixed(1)}% (Threshold: 85%)`);
      score = Math.max(score, latestMetric.cpuPercent >= 95.0 ? 0.90 : 0.70);
    }

    if (latestMetric.ramPercent && latestMetric.ramPercent >= 90.0) {
      reasons.push(`RAM usage reached ${latestMetric.ramPercent.toFixed(1)}% (Threshold: 90%)`);
      score = Math.max(score, 0.75);
    }

    if (latestMetric.diskPercent && latestMetric.diskPercent >= 90.0) {
      reasons.push(`Disk space critical at ${latestMetric.diskPercent.toFixed(1)}% (Threshold: 90%)`);
      score = Math.max(score, 0.85);
    }

    if (latestMetric.loadAvg && latestMetric.loadAvg >= 4.0) {
      reasons.push(`System load average spiked to ${latestMetric.loadAvg.toFixed(2)}`);
      score = Math.max(score, 0.65);
    }

    return {
      isAnomaly: reasons.length > 0,
      reasons,
      maxScore: score,
    };
  },

  evaluateErrorRate(historyLogs = []) {
    if (!historyLogs || historyLogs.length < 5) {
      return { isAnomaly: false, errorRate: 0.0 };
    }

    const failedChecks = historyLogs.filter((l) => l.status === 'DOWN' || (l.responseCode && l.responseCode >= 400)).length;
    const errorRate = failedChecks / historyLogs.length;
    const isAnomaly = errorRate >= 0.15;

    return {
      isAnomaly,
      errorRate: Number(errorRate.toFixed(2)),
      failedCount: failedChecks,
      totalCount: historyLogs.length,
    };
  },

  detectStatisticalAnomaly(device, recentLogs = [], recentAgentMetric = null) {
    const latestLog = recentLogs[0];
    const currentLatency = latestLog?.latency || 0;

    const latencyEval = this.evaluateLatency(currentLatency, recentLogs.slice(1));
    const serverEval = this.evaluateServerMetrics(recentAgentMetric);
    const errorEval = this.evaluateErrorRate(recentLogs);

    let anomalyScore = 0.0;
    const reasons = [];

    if (latencyEval.isAnomaly) {
      anomalyScore = Math.max(anomalyScore, Math.min(0.95, 0.40 + latencyEval.zScore * 0.12));
      reasons.push(`Latency spiked to ${currentLatency}ms (Baseline: ${latencyEval.mean}ms, Z-Score: ${latencyEval.zScore.toFixed(1)})`);
    }

    if (serverEval.isAnomaly) {
      anomalyScore = Math.max(anomalyScore, serverEval.maxScore);
      reasons.push(...serverEval.reasons);
    }

    if (errorEval.isAnomaly) {
      anomalyScore = Math.max(anomalyScore, 0.50 + errorEval.errorRate * 0.40);
      reasons.push(`High check failure rate of ${(errorEval.errorRate * 100).toFixed(0)}% in recent monitoring window`);
    }

    let severity = 'LOW';
    if (anomalyScore >= 0.75) {
      severity = 'CRITICAL';
    } else if (anomalyScore >= 0.60) {
      severity = 'HIGH';
    } else if (anomalyScore >= 0.40) {
      severity = 'MEDIUM';
    }

    const isAnomaly = anomalyScore >= 0.40 || reasons.length > 0;

    return {
      isAnomaly,
      anomalyScore: Number(anomalyScore.toFixed(2)),
      severity,
      detectionReason: reasons.length > 0 ? reasons.join('; ') : 'All telemetry signals within baseline parameters.',
      metrics: {
        latency: currentLatency,
        meanLatency: latencyEval.mean,
        zScore: latencyEval.zScore,
        errorRate: errorEval.errorRate,
        cpuPercent: recentAgentMetric?.cpuPercent || null,
        ramPercent: recentAgentMetric?.ramPercent || null,
        diskPercent: recentAgentMetric?.diskPercent || null,
      },
    };
  },
};
