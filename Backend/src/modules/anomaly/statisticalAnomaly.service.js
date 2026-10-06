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

  detectStatisticalAnomaly(device, recentLogs = []) {
    // Monitoring histories are chronological: the newest sample is last.
    const latestLog = recentLogs.at(-1);
    const currentLatency = latestLog?.latency || 0;

    const latencyEval = this.evaluateLatency(currentLatency, recentLogs.slice(0, -1));
    const errorEval = this.evaluateErrorRate(recentLogs.slice(-5));

    let anomalyScore = 0.0;
    const reasons = [];

    let consecutiveFailures = 0;
    for (const log of [...recentLogs].reverse()) {
      if (log.status !== 'DOWN' && !(log.responseCode >= 400)) break;
      consecutiveFailures++;
    }
    if (consecutiveFailures) {
      anomalyScore = consecutiveFailures >= 3 ? 0.9 : consecutiveFailures >= 2 ? 0.7 : 0.5;
      reasons.push(`${consecutiveFailures} consecutive failed health checks`);
    }

    if (latencyEval.isAnomaly) {
      anomalyScore = Math.max(anomalyScore, Math.min(0.95, 0.40 + latencyEval.zScore * 0.12));
      reasons.push(`Latency spiked to ${currentLatency}ms (Baseline: ${latencyEval.mean}ms, Z-Score: ${latencyEval.zScore.toFixed(1)})`);
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
        consecutiveFailures,
      },
    };
  },
};
