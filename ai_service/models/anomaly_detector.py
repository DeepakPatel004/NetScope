import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.ensemble import IsolationForest
from schemas import MetricLog, AnomalyDetectionResponse

class IsolationForestAnomalyDetector:
    """
    Isolation Forest Anomaly Detector for Infrastructure Telemetry.
    
    Why Isolation Forest?
    ---------------------
    Isolation Forest isolates anomalies instead of profiling normal data points.
    It builds an ensemble of random decision trees. Anomalies require fewer splits 
    (shorter path length in trees) because they are rare and have distinct feature values.
    
    This approach is ideal for monitoring because:
    1. Unsupervised: Does not require pre-labeled outage data.
    2. Non-parametric: Handles non-linear multi-metric distributions (latency + HTTP status + network delays).
    3. Fast execution: Runs in O(n log n) time complexity, perfect for real-time check workers.
    """
    
    def __init__(self, n_estimators: int = 100, contamination: float = 0.15):
        self.n_estimators = n_estimators
        self.contamination = contamination
        
    def _extract_features(self, history: List[MetricLog]) -> Tuple[np.ndarray, List[Dict[str, float]], Dict[str, Any]]:
        """
        Extract numerical feature vectors for ML model.
        Features engineered:
        1. Latency (ms)
        2. Is_Error (1 for 5xx/DOWN, 0 for 2xx/3xx/UP)
        3. Error_Rate (rolling error proportion)
        4. Consecutive_Failures (running streak of DOWN checks)
        5. Network_Delay (dns + tcp + tls + ttfb time in ms)
        """
        feature_rows = []
        raw_dicts = []
        
        consecutive = 0
        error_count = 0
        
        for i, log in enumerate(history):
            lat = float(log.latency or 0.0)
            is_down = log.status.upper() == "DOWN"
            resp_code = log.response_code or (500 if is_down else 200)
            is_err = 1.0 if (is_down or resp_code >= 400) else 0.0
            
            if is_err > 0:
                consecutive += 1
                error_count += 1
            else:
                consecutive = 0
                
            err_rate = error_count / float(i + 1)
            net_delay = float(log.dns_time or 0) + float(log.tcp_time or 0) + float(log.tls_time or 0) + float(log.ttfb_time or 0)
            
            feature_vector = [lat, is_err, err_rate, float(consecutive), net_delay]
            feature_rows.append(feature_vector)
            raw_dicts.append({
                "latency": lat,
                "is_error": is_err,
                "error_rate": err_rate,
                "consecutive_failures": float(consecutive),
                "network_delay": net_delay,
                "response_code": float(resp_code)
            })
            
        X = np.array(feature_rows) if feature_rows else np.zeros((0, 5))
        
        # Calculate baseline statistics
        baseline_stats = {}
        if len(feature_rows) > 0:
            latencies = [r[0] for r in feature_rows]
            baseline_stats = {
                "mean_latency": float(np.mean(latencies)),
                "std_latency": float(np.std(latencies)),
                "p95_latency": float(np.percentile(latencies, 95)) if len(latencies) >= 5 else float(np.max(latencies)),
                "total_checks": len(feature_rows),
                "total_errors": error_count,
            }
            
        return X, raw_dicts, baseline_stats

    def detect(self, request_data: Any) -> AnomalyDetectionResponse:
        history = request_data.history
        
        if not history:
            return AnomalyDetectionResponse(
                is_anomaly=False,
                anomaly_score=0.0,
                severity="LOW",
                detection_reason="No monitoring history provided to analyze.",
                metrics_evaluated={}
            )
            
        X, raw_dicts, baseline_stats = self._extract_features(history)
        latest_log = history[-1]
        latest_features = raw_dicts[-1]
        
        # ML Inference using Isolation Forest
        if len(history) >= 6:
            clf = IsolationForest(
                n_estimators=self.n_estimators,
                contamination=self.contamination,
                random_state=42
            )
            # Fit only previous samples: the point being assessed is not training data.
            clf.fit(X[:-1])
            
            # decision_function output: positive for normal, negative for anomaly
            decision_score = clf.decision_function([X[-1]])[0]
            
            # Normalize decision score to [0.0, 1.0] where 1.0 is maximum anomaly
            # Decision function typically ranges between -0.5 and +0.5
            # A non-negative decision is normal. The old 0.5 offset made
            # identical healthy samples exceed the anomaly threshold.
            raw_anomaly_score = float(max(0.0, -decision_score) * 4.0)
            anomaly_score = float(np.clip(raw_anomaly_score, 0.0, 1.0))
        else:
            # Rule-based bootstrap score for initial data points (< 5 checks)
            anomaly_score = 0.0
            if latest_features["is_error"] > 0:
                anomaly_score += 0.5
            if latest_features["latency"] > 1000:
                anomaly_score += 0.3
            anomaly_score = min(anomaly_score, 1.0)

        # Threshold rules & Anomaly Determination
        consecutive_failures = int(latest_features["consecutive_failures"])
        error_rate = sum(row["is_error"] for row in raw_dicts[-5:]) / len(raw_dicts[-5:])
        latest_latency = latest_features["latency"]
        prior_latencies = [row["latency"] for row in raw_dicts[:-1] if not row["is_error"]]
        mean_latency = float(np.mean(prior_latencies)) if prior_latencies else latest_latency
        
        is_anomaly = False
        severity = "LOW"
        reasons = []

        # High latency deviation check
        latency_spike_ratio = (latest_latency / (mean_latency + 1e-5)) if mean_latency > 0 else 1.0
        
        # Explicit signals still detect sustained failures when the model has
        # learned an outage as its baseline or there are too few samples.
        if consecutive_failures >= 3 or (latest_features["is_error"] and error_rate > 0.6 and len(history) >= 3):
            anomaly_score = max(anomaly_score, 0.9)
        elif consecutive_failures >= 2:
            anomaly_score = max(anomaly_score, 0.7)
        elif latest_features["is_error"] or latest_latency > 1000 or latency_spike_ratio > 2.5:
            anomaly_score = max(anomaly_score, 0.5)

        # Lower latency after an outage is recovery, not a new failure.
        adverse_signal = latest_features["is_error"] or latest_latency > 1000 or latency_spike_ratio > 1.5
        if not adverse_signal:
            anomaly_score = 0.0

        if anomaly_score >= 0.75:
            is_anomaly = True
            severity = "CRITICAL"
        elif anomaly_score >= 0.60:
            is_anomaly = True
            severity = "HIGH"
        elif anomaly_score >= 0.40:
            is_anomaly = True
            severity = "MEDIUM"
        elif anomaly_score > 0.30:
            is_anomaly = False
            severity = "LOW"

        # Build human-readable explainable reason
        if latest_log.status.upper() == "DOWN":
            reasons.append(f"Service returned DOWN status ({latest_log.message or 'Connection failed'}).")
        if consecutive_failures > 1:
            reasons.append(f"{consecutive_failures} consecutive check failures detected.")
        if latency_spike_ratio > 2.0 and mean_latency > 0:
            reasons.append(f"Latency spiked to {int(latest_latency)}ms ({latency_spike_ratio:.1f}x historical baseline mean of {int(mean_latency)}ms).")
        if latest_features["response_code"] >= 500:
            reasons.append(f"HTTP Server Error response code {int(latest_features['response_code'])}.")
        elif latest_features["response_code"] >= 400:
            reasons.append(f"HTTP Client Error response code {int(latest_features['response_code'])}.")

        if not reasons:
            if is_anomaly:
                reasons.append(f"Multi-metric anomaly pattern detected by Isolation Forest model (Anomaly score: {anomaly_score:.2f}).")
            else:
                reasons.append("Monitoring metrics within normal operational thresholds.")

        detection_reason = " ".join(reasons)
        
        metrics_evaluated = {
            "latest_latency_ms": int(latest_latency),
            "baseline_mean_latency_ms": int(mean_latency),
            "latency_spike_ratio": round(latency_spike_ratio, 2),
            "consecutive_failures": consecutive_failures,
            "error_rate": round(error_rate, 2),
            "response_code": int(latest_features["response_code"]),
            "anomaly_score": round(anomaly_score, 4),
            "sample_count": len(history)
        }
        
        return AnomalyDetectionResponse(
            is_anomaly=is_anomaly,
            anomaly_score=round(anomaly_score, 4),
            severity=severity,
            detection_reason=detection_reason,
            metrics_evaluated=metrics_evaluated
        )

anomaly_detector = IsolationForestAnomalyDetector()
