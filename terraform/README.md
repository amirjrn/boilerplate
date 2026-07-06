# Terraform Infrastructure

This directory contains Terraform configuration to manage the complete DigitalOcean infrastructure for the Bob application.

## Prerequisites

1. Install Terraform: https://developer.hashicorp.com/terraform/downloads
2. DigitalOcean account with API token
3. SSH key added to DigitalOcean

## Infrastructure Managed

| Resource               | Description                                |
| ---------------------- | ------------------------------------------ |
| **Droplets**           | 4 compute instances (EU, NA, Asia, AU)     |
| **PostgreSQL**         | Managed PostgreSQL 15 database             |
| **Valkey**             | Managed Valkey (Redis-compatible) database |
| **Container Registry** | Private Docker registry                    |
| **Firewall**           | Network security rules                     |
| **Database Firewalls** | Allow droplets to connect to databases     |

## Quick Start

```bash
# Navigate to terraform directory
cd terraform

# Copy example variables and fill in your values
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your actual values

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes (creates infrastructure)
terraform apply

# View outputs (including GitHub secrets to configure)
terraform output

# View sensitive outputs
terraform output -raw database_url
terraform output -raw valkey_password
```

## Regions

| Name | DigitalOcean Slug | Location           |
| ---- | ----------------- | ------------------ |
| eu   | fra1              | Frankfurt, Germany |
| na   | nyc1              | New York, USA      |
| asia | sgp1              | Singapore          |
| au   | syd1              | Sydney, Australia  |

## After Deployment

After running `terraform apply`, you'll need to:

1. **Update GitHub Secrets** with the outputted values
2. **Run your CI/CD pipeline** to deploy the application

The `terraform output github_secrets_summary` command will show you exactly what to add.

## Destroying Infrastructure

⚠️ **WARNING**: This will delete ALL resources including databases!

```bash
terraform destroy
```

## State Management

By default, Terraform state is stored locally. For team environments, uncomment the `backend` block in `providers.tf` to use DigitalOcean Spaces for remote state.
