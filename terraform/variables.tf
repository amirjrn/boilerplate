# =============================================================================
# VARIABLES
# =============================================================================

variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with R2 permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

# -----------------------------------------------------------------------------
# GitHub Configuration (for setting repository secrets automatically)
# -----------------------------------------------------------------------------

variable "github_token" {
  description = "GitHub Personal Access Token with repo and secrets permissions"
  type        = string
  sensitive   = true
}

variable "github_owner" {
  description = "GitHub repository owner (username or organization)"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "ssh_key_fingerprint" {
  description = "Fingerprint of the SSH key to use for droplets (root access during creation)"
  type        = string
}

variable "ssh_username" {
  description = "Username for SSH access (matches SSH_USER in GitHub secrets)"
  type        = string
  default     = "deploy"
}

variable "ssh_public_key" {
  description = "Public SSH key content for the deploy user (INFRA_PUBLIC_KEY)"
  type        = string
}

variable "app_name" {
  description = "Application name used for naming resources"
  type        = string
  default     = "bob"
}

variable "environment" {
  description = "Environment (production, staging, etc.)"
  type        = string
  default     = "production"
}

# -----------------------------------------------------------------------------
# Droplet Configuration
# -----------------------------------------------------------------------------

variable "droplet_size" {
  description = "Size of the droplets"
  type        = string
  default     = "s-1vcpu-1gb"
}

variable "droplet_image" {
  description = "Image to use for droplets"
  type        = string
  default     = "docker-20-04"
}

variable "regions" {
  description = "Map of region names to DigitalOcean region slugs"
  type        = map(string)
  default = {
    eu   = "fra1"
    na   = "nyc1"
    asia = "sgp1"
    au   = "syd1"
  }
}

# -----------------------------------------------------------------------------
# Cloudflare Load Balancer Configuration
# -----------------------------------------------------------------------------

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for your domain"
  type        = string
}

variable "cloudflare_lb_hostname" {
  description = "Hostname for the load balancer (e.g., api.yourdomain.com)"
  type        = string
}

variable "cloudflare_notification_email" {
  description = "Email for load balancer health notifications"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------

variable "postgres_size" {
  description = "Size of the managed PostgreSQL cluster"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15"
}

variable "postgres_region" {
  description = "Region for the PostgreSQL cluster"
  type        = string
  default     = "fra1"
}

variable "valkey_size" {
  description = "Size of the managed Valkey/Redis cluster"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

variable "valkey_region" {
  description = "Region for the Valkey cluster"
  type        = string
  default     = "fra1"
}

# -----------------------------------------------------------------------------
# Container Registry Configuration
# -----------------------------------------------------------------------------

variable "registry_region" {
  description = "Region for the container registry"
  type        = string
  default     = "fra1"
}

variable "registry_subscription_tier" {
  description = "Subscription tier for the container registry"
  type        = string
  default     = "basic"
}

# -----------------------------------------------------------------------------
# Cloudflare R2 Configuration
# -----------------------------------------------------------------------------

variable "r2_bucket_name" {
  description = "Name of the R2 bucket for object storage"
  type        = string
  default     = "bob-bucket"
}
