# Evaluation scope

The local comparison harness (`node scripts/run_evaluation.js`) compares immediate alerts with rule-based verification across healthy, outage, simulated probe connectivity, transient failure and location-labelled fixtures.

It uses a local server and the backend check runner with simulated observations. It does not run the standalone remote probes through the complete coordinator protocol. It cannot establish real cloud latency, alert accuracy, notification delivery or distributed concurrency safety.

Running the harness replaces this file with fixture counts and local timing measurements. Prior claims of 100% false-alarm elimination and millisecond distributed confirmation were not supported by end-to-end cloud measurements and have been removed.

For deployment evidence, run actual probes on independent hosts, inject faults, record assignment-to-incident timestamps and retain raw results. Report the topology, sample sizes, missed incidents, false alerts and verification request overhead together.
