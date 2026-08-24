import time
import argparse
import logging
import platform
import subprocess
import shutil
import json
import os
import psutil
import httpx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] NetScope Agent: %(message)s"
)

logger = logging.getLogger("netscope_agent")

def discover_docker_environment():
    """
    Discovers Docker daemon availability, running containers, and Docker Compose projects.
    """
    docker_bin = shutil.which("docker")
    if not docker_bin:
        return {
            "dockerStatus": "NOT_INSTALLED",
            "containers": [],
            "dockerComposeProjects": []
        }

    # Check if docker daemon is running
    try:
        ping = subprocess.run([docker_bin, "info"], capture_output=True, text=True, timeout=5)
        if ping.returncode != 0:
            return {
                "dockerStatus": "AVAILABLE_BUT_STOPPED",
                "containers": [],
                "dockerComposeProjects": []
            }
    except Exception as e:
        logger.warning(f"Docker info ping warning: {e}")
        return {
            "dockerStatus": "ERROR",
            "containers": [],
            "dockerComposeProjects": []
        }

    containers = []
    compose_projects = set()

    try:
        # Inspect containers via docker ps
        res = subprocess.run(
            [docker_bin, "ps", "-a", "--format", "{{json .}}"],
            capture_output=True,
            text=True,
            timeout=8
        )
        if res.returncode == 0:
            for line in res.stdout.splitlines():
                if not line.strip():
                    continue
                try:
                    c_data = json.loads(line)
                    c_id = c_data.get("ID", "")
                    c_name = c_data.get("Names", "")
                    c_image = c_data.get("Image", "")
                    c_status = c_data.get("Status", "")
                    c_ports = c_data.get("Ports", "")
                    c_created = c_data.get("CreatedAt", "")

                    containers.append({
                        "id": c_id,
                        "name": c_name,
                        "image": c_image,
                        "status": c_status,
                        "ports": c_ports,
                        "created": c_created
                    })

                    # Check for docker compose labels / project name
                    if "compose" in c_name.lower() or "_" in c_name:
                        project_name = c_name.split("_")[0] if "_" in c_name else c_name
                        compose_projects.add(project_name)
                except Exception:
                    pass
    except Exception as e:
        logger.warning(f"Container discovery warning: {e}")

    return {
        "dockerStatus": "RUNNING",
        "containers": containers,
        "dockerComposeProjects": list(compose_projects)
    }

def discover_agent_capabilities():
    """
    Discovers local OS, Docker capabilities, and recovery capabilities.
    """
    os_name = platform.system().lower()
    docker_env = discover_docker_environment()

    capabilities = ["host_metrics", "process_metrics"]

    if docker_env["dockerStatus"] == "RUNNING":
        capabilities.extend(["restart_container", "restart_compose_service"])

    return {
        "os": os_name,
        "hostname": platform.node(),
        "capabilities": capabilities,
        "dockerStatus": docker_env["dockerStatus"],
        "containers": docker_env["containers"],
        "dockerComposeProjects": docker_env["dockerComposeProjects"]
    }

def collect_system_metrics():
    """
    Collects host infrastructure metrics using psutil.
    """
    vmem = psutil.virtual_memory()
    try:
        disk = psutil.disk_usage('/')
    except Exception:
        disk = psutil.disk_usage('C:\\')

    try:
        load1, load5, load15 = psutil.getloadavg()
    except AttributeError:
        load1 = round(psutil.cpu_percent() / 20.0, 2)

    net_io = psutil.net_io_counters()

    return {
        "cpuPercent": float(psutil.cpu_percent(interval=1)),
        "ramPercent": float(vmem.percent),
        "ramUsedMb": float(round(vmem.used / (1024 * 1024), 2)),
        "ramTotalMb": float(round(vmem.total / (1024 * 1024), 2)),
        "diskPercent": float(disk.percent),
        "diskUsedGb": float(round(disk.used / (1024 * 1024 * 1024), 2)),
        "diskTotalGb": float(round(disk.total / (1024 * 1024 * 1024), 2)),
        "loadAvg": float(load1),
        "netBytesSent": float(net_io.bytes_sent),
        "netBytesRecv": float(net_io.bytes_recv),
    }

def execute_recovery_action(action_data: dict) -> dict:
    """
    Executes ONLY approved, allowlisted recovery actions (restart_container / restart_compose_service).
    Never executes arbitrary commands.
    """
    action_id = action_data.get("id")
    action_type = action_data.get("actionType")
    target_name = action_data.get("targetName")

    logger.info(f"Executing APPROVED Recovery Action #{action_id}: Type '{action_type}' on Target '{target_name}'")

    docker_bin = shutil.which("docker")
    if not docker_bin:
        return {
            "actionId": action_id,
            "status": "FAILED",
            "errorMessage": "Docker binary not found on target host"
        }

    if action_type in ["restart_container", "restart_compose_service"]:
        try:
            # Allowlisted docker restart execution
            cmd = [docker_bin, "restart", target_name]
            logger.info(f"Running safe docker command: {' '.join(cmd)}")
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

            if res.returncode == 0:
                logger.info(f"Successfully restarted target '{target_name}'. Execution Output: {res.stdout.strip()}")
                return {
                    "actionId": action_id,
                    "status": "SUCCESS",
                    "executionResult": f"Container/Service '{target_name}' restarted successfully: {res.stdout.strip()}"
                }
            else:
                logger.error(f"Docker restart returned non-zero exit code: {res.stderr.strip()}")
                return {
                    "actionId": action_id,
                    "status": "FAILED",
                    "errorMessage": f"Docker restart failed: {res.stderr.strip()}"
                }
        except Exception as e:
            logger.error(f"Recovery execution exception: {e}")
            return {
                "actionId": action_id,
                "status": "FAILED",
                "errorMessage": str(e)
            }
    else:
        logger.error(f"Rejected unsupported or non-allowlisted action type: {action_type}")
        return {
            "actionId": action_id,
            "status": "FAILED",
            "errorMessage": f"Unsupported action type '{action_type}'. Only restart_container and restart_compose_service are allowlisted."
        }

def run_agent(server_url: str, agent_key: str, interval_sec: int):
    endpoint = f"{server_url.rstrip('/')}/api/v3/agent/heartbeat"
    result_endpoint = f"{server_url.rstrip('/')}/api/v3/recovery/result"

    logger.info(f"Starting NetScope Risk & Incident Agent. Heartbeat interval: {interval_sec}s -> {endpoint}")

    headers = {
        "Content-Type": "application/json",
        "X-NetScope-Agent-Key": agent_key
    }

    client = httpx.Client(timeout=15.0)

    while True:
        try:
            metrics = collect_system_metrics()
            env_caps = discover_agent_capabilities()

            payload = {
                "agentKey": agent_key,
                "metrics": metrics,
                "capabilities": env_caps["capabilities"],
                "dockerStatus": env_caps["dockerStatus"],
                "containers": env_caps["containers"],
                "dockerComposeProjects": env_caps["dockerComposeProjects"],
                "os": env_caps["os"],
                "hostname": env_caps["hostname"],
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }

            response = client.post(endpoint, json=payload, headers=headers)
            if response.status_code == 200:
                resp_json = response.json()
                logger.info(f"Heartbeat delivered successfully. Host CPU: {metrics['cpuPercent']}% | Containers: {len(env_caps['containers'])}")

                # Check if backend dispatched an APPROVED recovery action
                pending_action = resp_json.get("pendingAction")
                if pending_action:
                    logger.info(f"Received APPROVED Recovery Action dispatch from Backend: {pending_action}")
                    exec_result = execute_recovery_action(pending_action)
                    
                    # Send execution result back to backend
                    try:
                        result_resp = client.post(result_endpoint, json=exec_result, headers=headers)
                        logger.info(f"Transmitted recovery execution result to Backend: {result_resp.status_code}")
                    except Exception as re_err:
                        logger.error(f"Failed to transmit execution result: {re_err}")
            else:
                logger.warning(f"Heartbeat returned HTTP {response.status_code}: {response.text}")

        except Exception as e:
            logger.error(f"Agent heartbeat loop exception: {e}")

        time.sleep(max(5, interval_sec))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NetScope Infrastructure Risk & Incident Agent")
    parser.add_argument("--server", default="http://localhost:5000", help="NetScope Backend Server URL")
    parser.add_argument("--key", required=True, help="Unique NetScope Agent Key for host target")
    parser.add_argument("--interval", type=int, default=15, help="Reporting interval in seconds")

    args = parser.parse_args()
    run_agent(args.server, args.key, args.interval)
