# Deploying NetScope

## Status

The repository includes a local lab and draft cloud infrastructure. The cloud topology has not been validated end to end. Do not treat the Terraform templates as a working one-command production deployment.

## Intended topology

- Central host: frontend/reverse proxy, coordinator, PostgreSQL and Redis.
- Probe A and Probe B: standalone containers on independent hosts or regions, polling the central HTTPS URL.
- Probes require outbound access; PostgreSQL and Redis remain private to the central stack.

Two containers on one host demonstrate process separation, not independent network failure domains.

## Central host preparation

Install Docker and Compose v2, clone the repository, and provide `POSTGRES_USER`, `POSTGRES_PASSWORD` and `JWT_SECRET` through a protected environment file. Use a URL-safe database password or correctly encode it in the connection URL. Never commit credentials.

`docker-compose.prod.yml` is a starting configuration: it runs migrations without the public demo seed. Its Nginx configuration currently serves HTTP only. Publishing port 443 does not configure TLS. Configure a certificate and HTTPS termination before allowing remote credentials or user sessions over the public internet.

Production operator bootstrap is a separate step: create a user and promote the intended operator through a trusted administrative database session. Do not use the development seed to bootstrap a public installation because it creates known demo credentials and probe tokens.

Configure backup and restore procedures for PostgreSQL and limit SSH to trusted administrative access. The central host remains a single point of failure.

## Remote probes

Enroll each probe through the operator console and save its issued token securely. On each remote host, build the image from this repository:

```bash
docker build -t netscope-probe:local ./probe
```

Create a protected `probe.env` file containing:

```dotenv
COORDINATOR_URL=https://your-coordinator.example
PROBE_TOKEN=replace-with-issued-token
PROBE_REGION=actual-deployment-region
ALLOW_PRIVATE_LAB_NETWORKS=false
```

Then start the container without publishing ports:

```bash
docker run -d --name netscope-probe --restart unless-stopped --env-file probe.env netscope-probe:local
```

Confirm fresh heartbeats and target observations from both hosts. Record actual provider/region placement alongside the operator-assigned labels. Review remote runner SSRF coverage before permitting untrusted users to submit arbitrary targets.

## Terraform gaps to resolve before applying

The files in `terraform/` describe three regional VMs, but provisioning is incomplete:

- Remote user data refers to `netscope-probe:latest` without building or publishing that image.
- Remote probes target central HTTP port 5000, whereas production Compose keeps that API internal. Use the configured public HTTPS reverse proxy URL instead.
- SSH currently permits all source addresses; restrict it or use managed session access.
- Bootstrap scripts need alignment with Compose v2 and the actual application checkout.
- Probe tokens in user data and Terraform state need a secure provisioning approach.
- TLS, production operator creation, backup restoration and real fault validation are not automated.

Terraform state and local variable files are ignored by Git. Sensitive variable annotations alone do not encrypt state.

## Validate and account for costs

Before describing the system as multi-region deployed, test healthy checks, target failure, probe loss, coordinator interruption, lease expiry and recovery from both real hosts. Preserve raw observations and incident timestamps.

Estimate costs using current provider pricing for compute, disks, public IPv4, egress and any load balancer or DNS services. No fixed monthly estimate is asserted here. On teardown, inspect remaining disks, IPs and snapshots; the central Terraform disk is configured to survive instance termination.
