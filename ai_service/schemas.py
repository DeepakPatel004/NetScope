from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class MetricLog(BaseModel):
    timestamp: Optional[str] = None
    status: str  # "UP" or "DOWN"
    latency: Optional[float] = 0.0
    dns_time: Optional[float] = 0.0
    tcp_time: Optional[float] = 0.0
    tls_time: Optional[float] = 0.0
    ttfb_time: Optional[float] = 0.0
    response_code: Optional[int] = None
    message: Optional[str] = None

class AnomalyDetectionRequest(BaseModel):
    device_id: str
    device_name: Optional[str] = "Unknown Service"
    device_host: Optional[str] = "localhost"
    history: List[MetricLog] = Field(default_factory=list)

class AnomalyDetectionResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    severity: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    detection_reason: str
    metrics_evaluated: Dict[str, Any]

class IncidentAnalysisRequest(BaseModel):
    device_id: str
    device_name: Optional[str] = "Unknown Service"
    device_host: Optional[str] = "localhost"
    anomaly_score: float = 0.0
    severity: str = "MEDIUM"
    detection_reason: str = ""
    recent_logs: List[MetricLog] = Field(default_factory=list)
    baseline: Optional[Dict[str, Any]] = None

class IncidentAnalysisResponse(BaseModel):
    incident_summary: str
    severity: str
    risk_level: Optional[str] = "MEDIUM"
    business_impact: Optional[str] = "Service response degradation impacting target latency"
    recommended_action: Optional[str] = "inspect_telemetry"
    observations: List[str] = Field(default_factory=list)
    possible_causes: List[str] = Field(default_factory=list)
    recommended_investigations: List[str] = Field(default_factory=list)
    confidence: float = 0.85

class AlertPriorityRequest(BaseModel):
    severity: str = "MEDIUM"
    duration_checks: int = 1
    frequency_errors: int = 0
    error_rate: float = 0.0
    consecutive_failures: int = 0
    affected_service: str = "Unknown Service"
    anomaly_score: float = 0.0

class AlertPriorityResponse(BaseModel):
    priority: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    priority_score: float
    priority_reason: str

class TimelineSummaryRequest(BaseModel):
    device_name: str = "Service"
    logs: List[MetricLog] = Field(default_factory=list)
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class TimelineSummaryResponse(BaseModel):
    timeline_summary: str
    key_events: List[str]

class RemediationPlaybookRequest(BaseModel):
    device_name: str = "Service"
    device_host: str = "localhost"
    device_type: str = "WEBSITE"
    incident_summary: str = ""
    possible_causes: List[str] = Field(default_factory=list)

class RemediationPlaybookResponse(BaseModel):
    playbook_title: str
    estimated_recovery_mins: int
    cli_commands: List[str]
    remediation_steps: List[str]

class ExplainInsightRequest(BaseModel):
    kind: str = "general"
    prompt: str = ""
    device_name: Optional[str] = "Service"
    device_host: Optional[str] = "localhost"
    telemetry: Optional[Dict[str, Any]] = None

class ExplainInsightResponse(BaseModel):
    summary: str
    recommendations: List[str]
