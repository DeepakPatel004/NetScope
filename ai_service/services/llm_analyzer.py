import json
import httpx
import logging
from typing import Dict, Any, List
from config import settings
from schemas import (
    IncidentAnalysisRequest, 
    IncidentAnalysisResponse, 
    TimelineSummaryRequest, 
    TimelineSummaryResponse,
    RemediationPlaybookRequest,
    RemediationPlaybookResponse,
    ExplainInsightRequest,
    ExplainInsightResponse
)

logger = logging.getLogger("ai_service.llm_analyzer")

class LLMIncidentAnalyzer:
    """
    LLM Incident Analyzer using Groq API (Llama 3.3 70B / GPT-OSS 20B) for ultra-fast, structured SRE incident diagnosis,
    timeline summarization, automated remediation playbooks, and interactive human-like telemetry Q&A explanations.
    """

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL

    async def analyze_incident(self, request: IncidentAnalysisRequest) -> IncidentAnalysisResponse:
        prompt = self._build_incident_prompt(request)
        
        if settings.AI_ENABLED and self.api_key:
            try:
                llm_response = await self._call_groq(prompt)
                if llm_response:
                    parsed = self._clean_and_parse_json(llm_response)
                    if parsed:
                        return IncidentAnalysisResponse(
                            incident_summary=parsed.get("incident_summary", "Incident detected in monitored service."),
                            severity=parsed.get("severity", request.severity),
                            observations=parsed.get("observations", []),
                            possible_causes=parsed.get("possible_causes", []),
                            recommended_investigations=parsed.get("recommended_investigations", []),
                            confidence=float(parsed.get("confidence", 0.85))
                        )
            except Exception as e:
                logger.warning(f"Groq API call failed for incident analysis: {e}")

        # Deterministic Grounded Fallback
        return self._generate_fallback_incident_analysis(request)

    async def summarize_timeline(self, request: TimelineSummaryRequest) -> TimelineSummaryResponse:
        prompt = self._build_timeline_prompt(request)
        
        if settings.AI_ENABLED and self.api_key:
            try:
                llm_response = await self._call_groq(prompt)
                if llm_response:
                    parsed = self._clean_and_parse_json(llm_response)
                    if parsed:
                        return TimelineSummaryResponse(
                            timeline_summary=parsed.get("timeline_summary", "Incident timeline summary."),
                            key_events=parsed.get("key_events", [])
                        )
            except Exception as e:
                logger.warning(f"Groq API call failed for timeline summary: {e}")

        return self._generate_fallback_timeline(request)

    async def generate_playbook(self, request: RemediationPlaybookRequest) -> RemediationPlaybookResponse:
        prompt = f"""
Generate an actionable CLI remediation playbook to resolve the infrastructure incident described below.

Target Service: {request.device_name} ({request.device_host})
Type: {request.device_type}
Incident Summary: {request.incident_summary}
Possible Causes: {", ".join(request.possible_causes)}

Respond with EXACT JSON matching this schema:
{{
  "playbook_title": "Automated SRE Recovery Playbook — {request.device_name}",
  "estimated_recovery_mins": 5,
  "cli_commands": [
    "curl -I {request.device_host}",
    "docker restart {request.device_name.lower().replace(' ', '-')}",
    "systemctl status network-manager"
  ],
  "remediation_steps": [
    "Verify socket connectivity ping against target host '{request.device_host}'",
    "Review host systemctl and container logs for process crashes",
    "Flush local DNS resolver cache and verify firewall rules"
  ]
}}
"""
        if settings.AI_ENABLED and self.api_key:
            try:
                llm_response = await self._call_groq(prompt)
                if llm_response:
                    parsed = self._clean_and_parse_json(llm_response)
                    if parsed:
                        return RemediationPlaybookResponse(
                            playbook_title=parsed.get("playbook_title", f"Remediation Playbook — {request.device_name}"),
                            estimated_recovery_mins=int(parsed.get("estimated_recovery_mins", 5)),
                            cli_commands=parsed.get("cli_commands", []),
                            remediation_steps=parsed.get("remediation_steps", [])
                        )
            except Exception as e:
                logger.warning(f"Groq API call failed for remediation playbook: {e}")

        return RemediationPlaybookResponse(
            playbook_title=f"SRE Incident Remediation Playbook — {request.device_name}",
            estimated_recovery_mins=5,
            cli_commands=[
                f"curl -Iv http://{request.device_host}",
                f"ping -c 4 {request.device_host}",
                f"docker ps --filter name={request.device_name.lower().replace(' ', '-')}",
                "systemctl status network-manager"
            ],
            remediation_steps=[
                f"Execute socket connectivity ping against target host '{request.device_host}'",
                "Review systemctl and container execution logs for process crashes",
                "Flush local DNS resolver cache and verify gateway firewall rules",
                "Restart application service process if memory limit is exceeded"
            ]
        )

    async def explain_insight(self, request: ExplainInsightRequest) -> ExplainInsightResponse:
        user_inquiry = request.prompt or "Provide an overall telemetry summary"
        prompt = f"""
You are an intelligent, human-like Senior Site Reliability Engineer (SRE) and DevOps Assistant.
Answer the user's specific inquiry directly, conversationally, and accurately.

Target Monitored Endpoint: {request.device_name} ({request.device_host})
User Inquiry: "{user_inquiry}"
Telemetry Context: {json.dumps(request.telemetry or {})}

CRITICAL INSTRUCTIONS:
1. ADDRESS THE USER'S INQUIRY DIRECTLY FIRST:
   - If the user asks "what is DNS", define DNS clearly in plain English first, and then briefly connect it to {request.device_name}'s DNS lookup telemetry if relevant.
   - If the user asks about health, SSL, or ports, answer that specific topic naturally.
   - Do NOT output a generic canned device status template if the user asked a specific question.
2. Keep the answer natural, concise, professional, and friendly (no robotic template repetition).
3. Provide 2-3 relevant, actionable technical recommendations matching the question.
4. Output MUST be strictly valid JSON matching this schema with NO markdown wrappers:

{{
  "summary": "Direct, conversational, accurate response answering the user's inquiry",
  "recommendations": ["Relevant action item 1", "Relevant action item 2"]
}}
"""
        if settings.AI_ENABLED and self.api_key:
            try:
                llm_response = await self._call_groq(prompt)
                if llm_response:
                    parsed = self._clean_and_parse_json(llm_response)
                    if parsed and "summary" in parsed:
                        return ExplainInsightResponse(
                            summary=parsed.get("summary", f"Telemetry for {request.device_name} indicates nominal health."),
                            recommendations=parsed.get("recommendations", ["Continue standard monitoring sweeps."])
                        )
            except Exception as e:
                logger.warning(f"Groq API call failed for explain_insight: {e}")

        return ExplainInsightResponse(
            summary=f"Telemetry report for {request.device_name} ({request.device_host}): Endpoint is responsive.",
            recommendations=[
                "Continue routine automated monitoring sweeps.",
                "Review security configurations periodically."
            ]
        )

    def _build_incident_prompt(self, req: IncidentAnalysisRequest) -> str:
        logs_str = "\n".join([
            f"[{log.timestamp or 'N/A'}] status={log.status} latency={log.latency}ms code={log.response_code} msg={log.message or 'None'}"
            for log in req.recent_logs[:15]
        ]) if req.recent_logs else "No detailed log entries."

        return f"""
You are an expert Site Reliability Engineer (SRE). Perform an incident analysis based STRICTLY on the telemetry provided below.

Telemetry:
- Target Device: {req.device_name} ({req.device_host})
- Anomaly Score: {req.anomaly_score:.2f}
- Current Severity: {req.severity}
- Detection Reason: {req.detection_reason}
- Recent Telemetry Logs:
{logs_str}

Respond with EXACT JSON format matching this schema:
{{
  "incident_summary": "1-2 sentence overview of the incident",
  "severity": "{req.severity}",
  "observations": ["Fact 1 from telemetry", "Fact 2 from telemetry"],
  "possible_causes": ["Hypothesis 1", "Hypothesis 2"],
  "recommended_investigations": ["Step 1", "Step 2"],
  "confidence": 0.95
}}
"""

    def _build_timeline_prompt(self, req: TimelineSummaryRequest) -> str:
        logs_str = "\n".join([
            f"[{log.timestamp or 'N/A'}] {log.status} | Latency: {log.latency}ms | HTTP: {log.response_code} | Msg: {log.message or ''}"
            for log in req.logs
        ]) if req.logs else "No logs."

        return f"""
Summarize the following monitoring check event timeline into a clear concise SRE narrative statement.

Service Name: {req.device_name}
Time Window: {req.start_time or 'Start'} to {req.end_time or 'End'}

Event Telemetry:
{logs_str}

Respond with EXACT JSON format:
{{
  "timeline_summary": "Concise narrative description",
  "key_events": ["Key event at HH:MM - description", "Key event 2"]
}}
"""

    async def _call_groq(self, prompt: str) -> str:
        endpoint = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        body = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a Principal Site Reliability Engineer (SRE) AI assistant. You answer user questions accurately, naturally, and directly. Always respond strictly in valid JSON format."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(endpoint, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    def _clean_and_parse_json(self, raw_text: str) -> Dict[str, Any]:
        text = raw_text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        return json.loads(text)

    def _generate_fallback_incident_analysis(self, req: IncidentAnalysisRequest) -> IncidentAnalysisResponse:
        observations = []
        possible_causes = []
        recommended_steps = []

        if req.recent_logs:
            down_checks = [l for l in req.recent_logs if l.status == "DOWN"]
            latencies = [l.latency for l in req.recent_logs if l.latency]
            max_lat = max(latencies) if latencies else 0

            observations.append(f"Analyzed {len(req.recent_logs)} recent health check events for target '{req.device_name}'.")
            if down_checks:
                observations.append(f"{len(down_checks)} health checks returned status DOWN.")
            if max_lat > 0:
                observations.append(f"Maximum observed response latency reached {int(max_lat)}ms.")
            if req.detection_reason:
                observations.append(f"Detector reported: {req.detection_reason}")
        else:
            observations.append(f"Anomaly score {req.anomaly_score:.2f} triggered for service '{req.device_name}'.")

        if req.severity in ["HIGH", "CRITICAL"]:
            possible_causes.append("Backend service process failure or container crash.")
            possible_causes.append("Network socket connection timeout or DNS resolution failure.")
            possible_causes.append("Upstream database connection pool exhaustion or high CPU load.")
            
            recommended_steps.append("Verify target application process status and container logs.")
            recommended_steps.append("Check host network interfaces, firewalls, and DNS resolution.")
            recommended_steps.append("Inspect CPU, RAM, and database connection pools on host server.")
        else:
            possible_causes.append("Transient network jitter or momentary response delay.")
            possible_causes.append("Minor latency surge during garbage collection or background job execution.")
            
            recommended_steps.append("Monitor subsequent health check cycles for persistent degradation.")
            recommended_steps.append("Review application performance telemetry logs.")

        summary = f"Incident detected on {req.device_name} ({req.device_host}). " + (req.detection_reason or f"Severity level evaluated as {req.severity}.")

        return IncidentAnalysisResponse(
            incident_summary=summary,
            severity=req.severity,
            observations=observations,
            possible_causes=possible_causes,
            recommended_investigations=recommended_steps,
            confidence=0.88
        )

    def _generate_fallback_timeline(self, req: TimelineSummaryRequest) -> TimelineSummaryResponse:
        if not req.logs:
            return TimelineSummaryResponse(
                timeline_summary=f"No telemetry logs recorded for service {req.device_name} in selected window.",
                key_events=[]
            )

        start_t = req.start_time or (req.logs[0].timestamp if req.logs else "Start")
        end_t = req.end_time or (req.logs[-1].timestamp if req.logs else "End")

        down_count = sum(1 for l in req.logs if l.status == "DOWN")
        latencies = [l.latency for l in req.logs if l.latency is not None]
        avg_lat = sum(latencies) / len(latencies) if latencies else 0
        max_lat = max(latencies) if latencies else 0

        key_events = []
        for l in req.logs:
            if l.status == "DOWN":
                key_events.append(f"[{l.timestamp or 'Check'}] Service status marked DOWN ({l.message or 'Failed'})")
            elif l.latency and l.latency > 1500:
                key_events.append(f"[{l.timestamp or 'Check'}] Latency spike of {int(l.latency)}ms detected")

        if down_count > 0:
            narrative = f"Between {start_t} and {end_t}, {req.device_name} experienced {down_count} failed checks with peak latency reaching {int(max_lat)}ms before recovery."
        elif max_lat > 1000:
            narrative = f"Between {start_t} and {end_t}, {req.device_name} latency elevated to a peak of {int(max_lat)}ms (average {int(avg_lat)}ms)."
        else:
            narrative = f"Between {start_t} and {end_t}, {req.device_name} operated within normal parameters with an average latency of {int(avg_lat)}ms across {len(req.logs)} checks."

        return TimelineSummaryResponse(
            timeline_summary=narrative,
            key_events=key_events[:10]
        )

llm_analyzer = LLMIncidentAnalyzer()
