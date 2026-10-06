variable "aws_region_central" {
  description = "AWS Region for the Central Coordinator Host (API, DB, Web Dashboard)"
  type        = string
  default     = "us-east-1"
}

variable "aws_region_probe_a" {
  description = "AWS Region for Remote Probe A"
  type        = string
  default     = "us-west-2"
}

variable "aws_region_probe_b" {
  description = "AWS Region for Remote Probe B"
  type        = string
  default     = "eu-central-1"
}

variable "instance_type" {
  description = "EC2 Instance type (cost-optimized compute)"
  type        = string
  default     = "t3.small"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key for operator shell access"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "coordinator_domain" {
  description = "Optional custom domain name for the coordinator (e.g. netscope.example.com)"
  type        = string
  default     = ""
}

variable "probe_token_a" {
  description = "Authentication secret token for Probe A"
  type        = string
  sensitive   = true
  default     = "nsp_probe_cloud_region_a_token_secret"
}

variable "probe_token_b" {
  description = "Authentication secret token for Probe B"
  type        = string
  sensitive   = true
  default     = "nsp_probe_cloud_region_b_token_secret"
}
