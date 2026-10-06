import asyncio
import unittest
from unittest.mock import AsyncMock, patch

from models.anomaly_detector import anomaly_detector
from schemas import AnomalyDetectionRequest, MetricLog, ExplainInsightRequest, IncidentAnalysisRequest
from services.llm_analyzer import llm_analyzer
from main import explain_insight, analyze_incident


def detect(logs):
    return anomaly_detector.detect(AnomalyDetectionRequest(device_id='test-device', history=logs))


class AnomalyTests(unittest.TestCase):
    def test_constant_healthy_traffic_is_normal(self):
        result = detect([MetricLog(status='UP', latency=20, response_code=200)] * 30)
        self.assertFalse(result.is_anomaly)
        self.assertEqual(result.anomaly_score, 0)

    def test_small_healthy_variations_are_normal(self):
        result = detect([MetricLog(status='UP', latency=latency) for latency in [20, 22, 19, 21, 20, 23, 20]])
        self.assertFalse(result.is_anomaly)

    def test_latency_spike_uses_previous_baseline(self):
        result = detect([MetricLog(status='UP', latency=20)] * 10 + [MetricLog(status='UP', latency=1800)])
        self.assertTrue(result.is_anomaly)
        self.assertEqual(result.metrics_evaluated['baseline_mean_latency_ms'], 20)

    def test_continuous_outage_is_critical(self):
        result = detect([MetricLog(status='DOWN', latency=0, response_code=503)] * 30)
        self.assertTrue(result.is_anomaly)
        self.assertEqual(result.severity, 'CRITICAL')
        self.assertGreaterEqual(result.anomaly_score, 0.75)

    def test_recovery_is_not_a_new_anomaly(self):
        result = detect([MetricLog(status='DOWN', latency=0)] * 20 + [MetricLog(status='UP', latency=20)])
        self.assertFalse(result.is_anomaly)

    def test_empty_history_is_explicit(self):
        result = detect([])
        self.assertFalse(result.is_anomaly)
        self.assertIn('No monitoring history', result.detection_reason)

    def test_first_failure_is_not_critical(self):
        result = detect([MetricLog(status='DOWN')])
        self.assertTrue(result.is_anomaly)
        self.assertEqual(result.severity, 'MEDIUM')


class InsightTests(unittest.IsolatedAsyncioTestCase):
    async def test_endpoint_preserves_prompt_and_telemetry(self):
        request = ExplainInsightRequest(prompt='Why is it down?', telemetry={'healthLogs': [{'status': 'DOWN'}]})
        with patch.object(llm_analyzer, 'explain_insight', new=AsyncMock(return_value={'summary': 'Down', 'recommendations': []})) as explain:
            await explain_insight(request)
            explain.assert_awaited_once_with(request)

    async def test_no_model_does_not_claim_healthy(self):
        with patch.object(llm_analyzer, 'api_key', ''):
            result = await llm_analyzer.explain_insight(ExplainInsightRequest(device_name='Failed API'))
        self.assertIn('unavailable', result.summary)
        self.assertNotIn('Endpoint is responsive', result.summary)

    async def test_incident_uses_supplied_logs_without_unauthenticated_requests(self):
        request = IncidentAnalysisRequest(device_id='test', recent_logs=[MetricLog(status='DOWN')], detection_reason='HTTP 503')
        with patch.object(llm_analyzer, 'analyze_incident', new=AsyncMock(return_value={'incident_summary': 'HTTP 503'})) as analyze:
            result = await analyze_incident(request)
        analyze.assert_awaited_once_with(request)
        self.assertEqual(result['incident_summary'], 'HTTP 503')


if __name__ == '__main__':
    unittest.main()
