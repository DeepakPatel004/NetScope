output "coordinator_public_ip" {
  description = "Public IP address of the Central Coordinator Host"
  value       = aws_instance.central_coordinator.public_ip
}

output "coordinator_url" {
  description = "Access URL for the Coordinator and Dashboard"
  value       = "http://${aws_instance.central_coordinator.public_ip}:5000"
}

output "probe_a_region" {
  description = "Configured AWS Region for Probe A"
  value       = var.aws_region_probe_a
}

output "probe_a_public_ip" {
  description = "Public IP of Probe VM A (Used for SSH administration only)"
  value       = aws_instance.probe_region_a.public_ip
}

output "probe_b_region" {
  description = "Configured AWS Region for Probe B"
  value       = var.aws_region_probe_b
}

output "probe_b_public_ip" {
  description = "Public IP of Probe VM B (Used for SSH administration only)"
  value       = aws_instance.probe_region_b.public_ip
}
