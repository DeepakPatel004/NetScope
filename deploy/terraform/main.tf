terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# -------------------------------------------------------------
# Multi-Region Provider Configuration
# -------------------------------------------------------------
provider "aws" {
  alias  = "central"
  region = var.aws_region_central
}

provider "aws" {
  alias  = "probe_a"
  region = var.aws_region_probe_a
}

provider "aws" {
  alias  = "probe_b"
  region = var.aws_region_probe_b
}

# -------------------------------------------------------------
# AMI Lookup (Ubuntu 22.04 LTS x86_64)
# -------------------------------------------------------------
data "aws_ami" "ubuntu_central" {
  provider    = aws.central
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

data "aws_ami" "ubuntu_probe_a" {
  provider    = aws.probe_a
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"]
}

data "aws_ami" "ubuntu_probe_b" {
  provider    = aws.probe_b
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"]
}

# -------------------------------------------------------------
# SSH Key Pairs
# -------------------------------------------------------------
resource "aws_key_pair" "central" {
  provider   = aws.central
  key_name   = "netscope-central-key"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "aws_key_pair" "probe_a" {
  provider   = aws.probe_a
  key_name   = "netscope-probe-a-key"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "aws_key_pair" "probe_b" {
  provider   = aws.probe_b
  key_name   = "netscope-probe-b-key"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

# -------------------------------------------------------------
# 1. Central Host Machine (Coordinator API, DB, Web App)
# -------------------------------------------------------------
resource "aws_security_group" "central" {
  provider    = aws.central
  name        = "netscope-central-sg"
  description = "Inbound HTTPS, HTTP, SSH for Central Coordinator"

  ingress {
    description = "SSH administration"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS Management & Probe API"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP Redirect & Let's Encrypt challenge"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Outbound internet access"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "central_coordinator" {
  provider               = aws.central
  ami                    = data.aws_ami.ubuntu_central.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.central.key_name
  vpc_security_group_ids = [aws_security_group.central.id]

  root_block_device {
    volume_size           = 25
    volume_type           = "gp3"
    delete_on_termination = false
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update && apt-get install -y docker.io docker-compose git
              systemctl enable --now docker
              usermod -aG docker ubuntu
              mkdir -p /opt/netscope
              # Production deploy instructions will clone repo and launch docker-compose.prod.yml
              EOF

  tags = {
    Name        = "netscope-central-coordinator"
    Environment = "production"
    Role        = "coordinator"
  }
}

# -------------------------------------------------------------
# 2. Remote Probe Machine in Region A (Zero Inbound Ports)
# -------------------------------------------------------------
resource "aws_security_group" "probe_a" {
  provider    = aws.probe_a
  name        = "netscope-probe-a-sg"
  description = "Outbound-only security group for Remote Probe A (Zero inbound app ports)"

  ingress {
    description = "SSH administration only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # NOTE: No inbound HTTP (80) or HTTPS (443) ports required! Probes connect outbound only.

  egress {
    description = "Outbound checks and coordinator HTTPS polling"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "probe_region_a" {
  provider               = aws.probe_a
  ami                    = data.aws_ami.ubuntu_probe_a.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.probe_a.key_name
  vpc_security_group_ids = [aws_security_group.probe_a.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update && apt-get install -y docker.io
              systemctl enable --now docker
              usermod -aG docker ubuntu
              # Run NetScope probe container
              docker run -d \
                --name netscope-probe \
                --restart always \
                -e COORDINATOR_URL=http://${aws_instance.central_coordinator.public_ip}:5000 \
                -e PROBE_TOKEN=${var.probe_token_a} \
                -e PROBE_REGION=${var.aws_region_probe_a} \
                netscope-probe:latest
              EOF

  tags = {
    Name        = "netscope-probe-region-a"
    Environment = "production"
    Role        = "remote-probe"
    Region      = var.aws_region_probe_a
  }
}

# -------------------------------------------------------------
# 3. Remote Probe Machine in Region B (Zero Inbound Ports)
# -------------------------------------------------------------
resource "aws_security_group" "probe_b" {
  provider    = aws.probe_b
  name        = "netscope-probe-b-sg"
  description = "Outbound-only security group for Remote Probe B (Zero inbound app ports)"

  ingress {
    description = "SSH administration only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # NOTE: No inbound HTTP or HTTPS ports required!

  egress {
    description = "Outbound checks and coordinator HTTPS polling"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "probe_region_b" {
  provider               = aws.probe_b
  ami                    = data.aws_ami.ubuntu_probe_b.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.probe_b.key_name
  vpc_security_group_ids = [aws_security_group.probe_b.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update && apt-get install -y docker.io
              systemctl enable --now docker
              usermod -aG docker ubuntu
              # Run NetScope probe container
              docker run -d \
                --name netscope-probe \
                --restart always \
                -e COORDINATOR_URL=http://${aws_instance.central_coordinator.public_ip}:5000 \
                -e PROBE_TOKEN=${var.probe_token_b} \
                -e PROBE_REGION=${var.aws_region_probe_b} \
                netscope-probe:latest
              EOF

  tags = {
    Name        = "netscope-probe-region-b"
    Environment = "production"
    Role        = "remote-probe"
    Region      = var.aws_region_probe_b
  }
}
