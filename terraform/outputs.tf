# =============================================================================
# OUTPUTS
# =============================================================================
# These values are displayed after terraform apply and can be used in CI/CD

# -----------------------------------------------------------------------------
# Droplet Information
# -----------------------------------------------------------------------------

output "droplet_ips" {
  description = "Public IP addresses of all droplets"
  value = {
    for key, droplet in digitalocean_droplet.app : key => droplet.ipv4_address
  }
}

output "droplet_ip_eu" {
  description = "EU Droplet IP"
  value       = digitalocean_droplet.app["eu"].ipv4_address
}

output "droplet_ip_na" {
  description = "NA Droplet IP"
  value       = digitalocean_droplet.app["na"].ipv4_address
}

output "droplet_ip_asia" {
  description = "Asia Droplet IP"
  value       = digitalocean_droplet.app["asia"].ipv4_address
}

output "droplet_ip_au" {
  description = "Australia Droplet IP"
  value       = digitalocean_droplet.app["au"].ipv4_address
}

# -----------------------------------------------------------------------------
# Cloudflare Global Load Balancer
# -----------------------------------------------------------------------------

output "loadbalancer_hostname" {
  description = "Global load balancer hostname"
  value       = cloudflare_load_balancer.app.name
}

output "loadbalancer_pools" {
  description = "Load balancer pool IDs by region"
  value = {
    for key, pool in cloudflare_load_balancer_pool.regions : key => pool.id
  }
}

# -----------------------------------------------------------------------------
# PostgreSQL Database (Primary - Frankfurt)
# -----------------------------------------------------------------------------

output "postgres_host" {
  description = "PostgreSQL host"
  value       = digitalocean_database_cluster.postgres.host
}

output "postgres_port" {
  description = "PostgreSQL port"
  value       = digitalocean_database_cluster.postgres.port
}

output "postgres_database" {
  description = "PostgreSQL database name"
  value       = digitalocean_database_db.app_db.name
}

output "postgres_user" {
  description = "PostgreSQL user"
  value       = digitalocean_database_user.app_user.name
}

output "postgres_password" {
  description = "PostgreSQL password"
  value       = digitalocean_database_user.app_user.password
  sensitive   = true
}

output "database_url" {
  description = "Full DATABASE_URL for the application"
  value       = "postgresql://${digitalocean_database_user.app_user.name}:${digitalocean_database_user.app_user.password}@${digitalocean_database_cluster.postgres.host}:${digitalocean_database_cluster.postgres.port}/${digitalocean_database_db.app_db.name}?sslmode=require"
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Redis/Valkey (Managed)
# -----------------------------------------------------------------------------

output "redis_host" {
  description = "Redis/Valkey host"
  value       = digitalocean_database_cluster.valkey.host
}

output "redis_port" {
  description = "Redis/Valkey port"
  value       = digitalocean_database_cluster.valkey.port
}

output "redis_password" {
  description = "Redis/Valkey password"
  value       = digitalocean_database_cluster.valkey.password
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Container Registry
# -----------------------------------------------------------------------------

output "registry_endpoint" {
  description = "Container registry endpoint"
  value       = digitalocean_container_registry.main.endpoint
}

output "registry_name" {
  description = "Container registry name"
  value       = digitalocean_container_registry.main.name
}

# -----------------------------------------------------------------------------
# Cloudflare R2 Object Storage
# -----------------------------------------------------------------------------

output "r2_bucket_name" {
  description = "R2 bucket name"
  value       = cloudflare_r2_bucket.storage.name
}

output "r2_endpoint" {
  description = "R2 S3-compatible endpoint"
  value       = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
}

# -----------------------------------------------------------------------------
# GitHub Secrets - UPDATE OR ADD THESE
# -----------------------------------------------------------------------------
# Run these commands after `terraform apply` to set GitHub secrets:
#
# EXISTING (keep as-is):
#   - DO_REGISTRY_EMAIL
#   - DO_REGISTRY_TOKEN
#   - INFRA_PRIVATE_KEY
#   - SSH_USER

output "github_secrets_to_add" {
  description = "New secrets to add to GitHub"
  value       = <<-EOF
    
    ============================================================
    ADD/UPDATE THESE GITHUB REPOSITORY SECRETS:
    ============================================================
    
    --- DROPLET IPs ---
    DROPLET_IP_EU     = ${digitalocean_droplet.app["eu"].ipv4_address}
    DROPLET_IP_NA     = ${digitalocean_droplet.app["na"].ipv4_address}
    DROPLET_IP_ASIA   = ${digitalocean_droplet.app["asia"].ipv4_address}
    DROPLET_IP_AU     = ${digitalocean_droplet.app["au"].ipv4_address}
    
    --- DATABASE ---
    DATABASE_URL      = (run: terraform output -raw database_url)
    
    --- REDIS/VALKEY (for caching + OTP) ---
    REDIS_HOST        = ${digitalocean_database_cluster.valkey.host}
    REDIS_PORT        = ${digitalocean_database_cluster.valkey.port}
    REDIS_PASSWORD    = (run: terraform output -raw redis_password)
    
    --- SSH (already have these, just confirm) ---
    SSH_USER          = ${var.ssh_username}
    
    ============================================================
    
    NOTE: Secrets are set automatically by Terraform!
    No manual configuration needed after 'terraform apply'.
    
    ============================================================
  EOF
}

# Individual outputs for easy scripting
output "github_secret_DROPLET_IP_EU" {
  value = digitalocean_droplet.app["eu"].ipv4_address
}

output "github_secret_DROPLET_IP_NA" {
  value = digitalocean_droplet.app["na"].ipv4_address
}

output "github_secret_DROPLET_IP_ASIA" {
  value = digitalocean_droplet.app["asia"].ipv4_address
}

output "github_secret_DROPLET_IP_AU" {
  value = digitalocean_droplet.app["au"].ipv4_address
}

output "github_secret_DATABASE_URL" {
  value     = "postgresql://${digitalocean_database_user.app_user.name}:${digitalocean_database_user.app_user.password}@${digitalocean_database_cluster.postgres.host}:${digitalocean_database_cluster.postgres.port}/${digitalocean_database_db.app_db.name}?sslmode=require"
  sensitive = true
}

output "github_secret_REDIS_HOST" {
  value = digitalocean_database_cluster.valkey.host
}

output "github_secret_REDIS_PORT" {
  value = digitalocean_database_cluster.valkey.port
}

output "github_secret_REDIS_PASSWORD" {
  value     = digitalocean_database_cluster.valkey.password
  sensitive = true
}

output "github_secret_SSH_USER" {
  description = "SSH username for deployment"
  value       = var.ssh_username
}

output "github_secret_REGISTRY" {
  description = "Container registry URL for workflow"
  value       = digitalocean_container_registry.main.endpoint
}

# =============================================================================
# COMPLETE GITHUB SECRETS REFERENCE
# =============================================================================
# Secrets are automatically set by Terraform via github_actions_secret resources.
# After 'terraform apply', all secrets are configured in your GitHub repository.
#
# Manually managed secrets (not set by Terraform):
#   - SSH_USER
#   - INFRA_PRIVATE_KEY
#   - DO_REGISTRY_EMAIL
# =============================================================================
