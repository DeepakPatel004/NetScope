# NetScope Cloud Deployment & Operations Guide

## 1. Concrete Resource Plan & Estimated Cost

The recommended production architecture distributes NetScope across **three independent cloud instances**:

```
[Cloud Region 1 (e.g. us-east-1)]
  Central Host (VM A) - 1x t3.small
  - HTTPS Nginx Reverse Proxy & Built React Dashboard
  - Central Coordinator & Management API
  - PostgreSQL 15 & Redis 7 (Internal docker network, private)

[Cloud Region 2 (e.g. us-west-2)]
  Remote Probe (VM B) - 1x t3.small
  - Stateless NetScope Probe container (Zero inbound open ports)

[Cloud Region 3 (e.g. eu-central-1)]
  Remote Probe (VM C) - 1x t3.small
  - Stateless NetScope Probe container (Zero inbound open ports)
```

### Estimated Monthly AWS Cost Breakdown:
| Resource | Quantity | Unit Rate | Est. Monthly Cost |
| :--- | :---: | :---: | :---: |
| **EC2 Instances** (`t3.small` 2 vCPU, 2GB RAM) | 3 | ~$0.0208 / hr | ~$45.00 |
| **EBS Storage** (gp3 volumes: 1x 25GB + 2x 20GB) | 65 GB total | ~$0.08 / GB-mo | ~$5.20 |
| **Outbound Data Transfer** (API polling & check traffic) | ~15 GB | ~$0.09 / GB | ~$1.35 |
| **Total Estimated Operating Cost** | | | **~$51.55 / month (~$1.72 / day)** |

> **Cost Control Tip**: For testing and evaluation runs, instances can be provisioned and destroyed within 2 hours for under **$0.15 total**.

---

## 2. Automated Cloud Provisioning via Terraform

### Prerequisites:
1. Terraform CLI (`>= 1.5.0`) installed locally.
2. Configured AWS credentials (`aws configure` or environment variables `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`).
3. An SSH public key at `~/.ssh/id_rsa.pub` (or configured via variable).

### Step-by-Step Deployment:
1. Navigate to the terraform configuration:
   ```bash
   cd deploy/terraform
   ```
2. Create your local variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```
3. Initialize Terraform providers:
   ```bash
   terraform init
   ```
4. Review the concrete execution plan:
   ```bash
   terraform plan
   ```
5. Apply and provision the resources:
   ```bash
   terraform apply
   ```
6. Outputs will print the Central Host URL and Probe IP addresses:
   ```text
   coordinator_url = "http://54.210.xx.xx:5000"
   probe_a_region  = "us-west-2"
   probe_b_region  = "eu-central-1"
   ```

---

## 3. Teardown Instructions

To avoid incurring ongoing charges, destroy all provisioned cloud infrastructure when finished:
```bash
cd deploy/terraform
terraform destroy -auto-approve
```

---

## 4. Database Backup, Restore, and Data Retention

### Database Backup (Central Host):
```bash
# Dump compressed PostgreSQL backup
docker exec -t netscope-prod-postgres-1 pg_dump -U netscope_admin netscope_prod | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Database Restore:
```bash
# Decompress and restore database
gunzip -c backup_20261006_120000.sql.gz | docker exec -i netscope-prod-postgres-1 psql -U netscope_admin -d netscope_prod
```

### Retention Policy:
Check results and health logs are retained with indexed timestamps (`observedAt`). For long-running production environments, schedule an automated retention cleanup:
```sql
-- Purge routine check results older than 30 days while preserving active incidents:
DELETE FROM "CheckResult" WHERE "observedAt" < NOW() - INTERVAL '30 days';
DELETE FROM "HealthLog" WHERE "checkedAt" < NOW() - INTERVAL '30 days';
```

---

## 5. Architectural Boundaries & Known Single Point of Failure (SPOF)

1. **Central Coordinator SPOF**:
   The initial central host hosts the PostgreSQL database and API gateway. If the Central VM becomes unavailable, probes buffer check attempts locally and retry with exponential backoff and jitter. Outages of the central host are acknowledged as a design limitation of this single-coordinator architecture.
2. **Probes Require Zero Inbound Ports**:
   Probe security groups allow SSH from operator IPs and 100% block inbound application traffic (ports 80/443 are closed). All communication is initiated outbound to the central coordinator over TLS.
3. **Region Labels vs. Geographic Diversity**:
   Configured region strings (e.g. `us-east-1`, `eu-central-1`) are operator-assigned metadata. Physical geographic diversity is enforced by deploying probe VMs across independent AWS availability zones and VPC regions.
