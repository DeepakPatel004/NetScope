# NetScope Infrastructure Agent

A lightweight cross-platform Python monitoring agent that collects CPU, RAM, Disk, System Load, and Network metrics and reports them to NetScope.

## Quickstart

```bash
pip install -r requirements.txt
python agent.py --server=http://localhost:5000 --key=YOUR_AGENT_KEY --interval=15
```

## Options

- `--server`: NetScope Backend API URL (default: `http://localhost:5000`)
- `--key`: Required unique Agent Key generated for your server resource in NetScope.
- `--interval`: Metric reporting frequency in seconds (default: 15).
