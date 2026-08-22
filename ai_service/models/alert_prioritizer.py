from schemas import AlertPriorityRequest, AlertPriorityResponse

class AlertPrioritizer:
    """
    Deterministic Alert Priority Engine.
    
    Combines anomaly score, failure duration, consecutive failures, error rate,
    and base severity into a transparent priority score.
    
    Formula:
    --------
    Score = BaseSeverityWeight 
          + (0.5 * ConsecutiveFailures)
          + (4.0 * ErrorRate)
          + (2.5 * AnomalyScore)
          + (0.5 * DurationScore)
    """

    SEVERITY_WEIGHTS = {
        "LOW": 1.0,
        "MEDIUM": 3.0,
        "HIGH": 6.0,
        "CRITICAL": 9.0
    }

    def prioritize(self, request: AlertPriorityRequest) -> AlertPriorityResponse:
        base_weight = self.SEVERITY_WEIGHTS.get(request.severity.upper(), 3.0)
        
        consecutive_boost = 0.5 * min(request.consecutive_failures, 10)
        error_rate_boost = 4.0 * max(0.0, min(1.0, request.error_rate))
        anomaly_boost = 2.5 * max(0.0, min(1.0, request.anomaly_score))
        duration_boost = 0.5 * min(request.duration_checks / 5.0, 3.0)

        priority_score = base_weight + consecutive_boost + error_rate_boost + anomaly_boost + duration_boost

        if priority_score >= 10.0:
            final_priority = "CRITICAL"
        elif priority_score >= 7.0:
            final_priority = "HIGH"
        elif priority_score >= 3.5:
            final_priority = "MEDIUM"
        else:
            final_priority = "LOW"

        reason_parts = [
            f"Base severity '{request.severity}' (weight {base_weight:.1f}).",
            f"Anomaly score {request.anomaly_score:.2f} contributed +{anomaly_boost:.2f}.",
            f"{request.consecutive_failures} consecutive failures contributed +{consecutive_boost:.2f}.",
            f"Error rate {request.error_rate * 100:.1f}% contributed +{error_rate_boost:.2f}."
        ]
        
        priority_reason = f"Alert assigned priority '{final_priority}' with calculated score {priority_score:.2f}. " + " ".join(reason_parts)

        return AlertPriorityResponse(
            priority=final_priority,
            priority_score=round(priority_score, 2),
            priority_reason=priority_reason
        )

alert_prioritizer = AlertPrioritizer()
