import httpx
import logging
from typing import Dict, Any, List

logger = logging.getLogger("ai_service.mcp")

NETSCOPE_BACKEND_URL = "http://localhost:5000"

class NetScopeMCPTools:
    """
    NetScope Model Context Protocol (MCP) Read-Only Telemetry Layer.
    Queries NetScope backend APIs for live health, metrics, agent metrics, logs, and incidents.
    """

    def __init__(self, backend_url: str = NETSCOPE_BACKEND_URL):
        self.backend_url = backend_url.rstrip("/")

    async def get_service_health(self, device_id: str) -> Dict[str, Any]:
        """Fetch current health status and recent check summary for a target resource."""
        url = f"{self.backend_url}/api/v3/devices/{device_id}"
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.json().get("data", {})
                return {"error": f"Failed to fetch health: HTTP {resp.status_code}"}
            except Exception as e:
                logger.warning(f"[MCP] get_service_health failed: {e}")
                return {"error": str(e)}

    async def get_service_metrics(self, device_id: str, hours: int = 24) -> Dict[str, Any]:
        """Fetch historical response time, DNS, TCP, TLS, and TTFB latency metrics."""
        url = f"{self.backend_url}/api/v3/analytics/metrics/{device_id}?hours={hours}"
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.json().get("data", {})
                return {"error": f"Failed to fetch metrics: HTTP {resp.status_code}"}
            except Exception as e:
                logger.warning(f"[MCP] get_service_metrics failed: {e}")
                return {"error": str(e)}

    async def get_agent_status(self, device_id: str) -> Dict[str, Any]:
        """
        Fetch server CPU, RAM, Disk, Load, and Network metrics collected by NetScope Agent.
        """
        url = f"{self.backend_url}/api/v3/agent/metrics/{device_id}?hours=2"
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    if not data.get("metrics") or len(data.get("metrics", [])) == 0:
                        return {
                            "status": "NOT_CONNECTED",
                            "message": "Infrastructure metrics unavailable: No NetScope Agent connected for this resource.",
                            "device": data.get("device", {})
                        }
                    return data
                return {
                    "status": "NOT_CONNECTED",
                    "message": "Infrastructure metrics unavailable: No NetScope Agent connected or authorized for this resource."
                }
            except Exception as e:
                logger.warning(f"[MCP] get_agent_status failed: {e}")
                return {
                    "status": "NOT_CONNECTED",
                    "message": f"Infrastructure metrics unavailable: {str(e)}"
                }

    async def get_recent_logs(self, device_id: str) -> List[Dict[str, Any]]:
        """Fetch recent raw monitoring check logs."""
        url = f"{self.backend_url}/api/v3/devices/{device_id}/logs?limit=20"
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
                return []
            except Exception as e:
                logger.warning(f"[MCP] get_recent_logs failed: {e}")
                return []

    async def get_incident_history(self, device_id: str) -> List[Dict[str, Any]]:
        """Fetch past incident records for a resource."""
        url = f"{self.backend_url}/api/v3/ai/incidents?deviceId={device_id}"
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
                return []
            except Exception as e:
                logger.warning(f"[MCP] get_incident_history failed: {e}")
                return []

    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Returns JSON schema definitions of available read-only MCP tools for LangChain agent tool-calling."""
        return [
            {
                "name": "get_service_health",
                "description": "Fetch current health status, uptime ratio, and device details",
                "parameters": {"type": "object", "properties": {"device_id": {"type": "string"}}, "required": ["device_id"]}
            },
            {
                "name": "get_service_metrics",
                "description": "Fetch historical latency (DNS, TCP, TLS, TTFB) and error rates",
                "parameters": {"type": "object", "properties": {"device_id": {"type": "string"}, "hours": {"type": "integer"}}, "required": ["device_id"]}
            },
            {
                "name": "get_agent_status",
                "description": "Fetch server infrastructure metrics (CPU %, RAM %, Disk %, System Load) reported by NetScope Agent",
                "parameters": {"type": "object", "properties": {"device_id": {"type": "string"}}, "required": ["device_id"]}
            },
            {
                "name": "get_recent_logs",
                "description": "Fetch recent raw check logs",
                "parameters": {"type": "object", "properties": {"device_id": {"type": "string"}}, "required": ["device_id"]}
            },
            {
                "name": "get_incident_history",
                "description": "Fetch past incidents",
                "parameters": {"type": "object", "properties": {"device_id": {"type": "string"}}, "required": ["device_id"]}
            }
        ]

netscope_mcp = NetScopeMCPTools()
