# =============================================================================
# MAIN INFRASTRUCTURE
# =============================================================================

# -----------------------------------------------------------------------------
# Container Registry
# -----------------------------------------------------------------------------

resource "digitalocean_container_registry" "main" {
  name                   = "${var.app_name}-registry-${var.registry_region}"
  subscription_tier_slug = var.registry_subscription_tier
  region                 = var.registry_region
}

# -----------------------------------------------------------------------------
# Cloudflare R2 Object Storage
# -----------------------------------------------------------------------------

resource "cloudflare_r2_bucket" "storage" {
  account_id = var.cloudflare_account_id
  name       = var.r2_bucket_name
  location   = "EEUR"  # EU region, change to WNAM for US, APAC for Asia-Pacific
}

# -----------------------------------------------------------------------------
# Managed PostgreSQL Database
# -----------------------------------------------------------------------------

resource "digitalocean_database_cluster" "postgres" {
  name       = "${var.app_name}-postgres-${var.environment}"
  engine     = "pg"
  version    = var.postgres_version
  size       = var.postgres_size
  region     = var.postgres_region
  node_count = 1

  tags = [var.app_name, var.environment, "postgres"]
}

resource "digitalocean_database_db" "app_db" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = var.app_name
}

resource "digitalocean_database_user" "app_user" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "${var.app_name}_user"
}

# -----------------------------------------------------------------------------
# Managed Valkey (Redis-compatible) Database
# -----------------------------------------------------------------------------
# Used for:
# - OTP code storage (requires cross-region consistency)
# - Prisma query caching (via prisma-extension-redis)
# - Session data
# -----------------------------------------------------------------------------

resource "digitalocean_database_cluster" "valkey" {
  name       = "${var.app_name}-valkey-${var.environment}"
  engine     = "redis"
  version    = "7"
  size       = var.valkey_size
  region     = var.valkey_region
  node_count = 1

  tags = [var.app_name, var.environment, "valkey", "redis"]
}

# -----------------------------------------------------------------------------
# Droplets (Compute Instances)
# -----------------------------------------------------------------------------

resource "digitalocean_droplet" "app" {
  for_each = var.regions

  name     = "${var.app_name}-${each.key}-${var.environment}"
  size     = var.droplet_size
  image    = var.droplet_image
  region   = each.value
  ssh_keys = [var.ssh_key_fingerprint]

  tags = [var.app_name, var.environment, each.key]

  # User data script to set up Docker and SSH user
  user_data = <<-EOF
    #!/bin/bash
    set -e
    
    # Create SSH user
    useradd -m -s /bin/bash ${var.ssh_username}
    echo "${var.ssh_username} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/${var.ssh_username}
    
    # Set up SSH for the user
    mkdir -p /home/${var.ssh_username}/.ssh
    echo "${var.ssh_public_key}" >> /home/${var.ssh_username}/.ssh/authorized_keys
    chmod 700 /home/${var.ssh_username}/.ssh
    chmod 600 /home/${var.ssh_username}/.ssh/authorized_keys
    chown -R ${var.ssh_username}:${var.ssh_username} /home/${var.ssh_username}/.ssh
    
    # Install Docker
    apt-get update
    apt-get install -y ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine and Compose plugin
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add user to docker group
    usermod -aG docker ${var.ssh_username}
    
    # Enable and start Docker
    systemctl enable docker
    systemctl start docker
    
    # Create app directory
    mkdir -p /home/${var.ssh_username}/app
    chown -R ${var.ssh_username}:${var.ssh_username} /home/${var.ssh_username}/app
    
    # =========================================================================
    # SECURITY HARDENING - Disable root access
    # =========================================================================
    
    # Disable root SSH login
    sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
    
    # Disable password authentication (key-only)
    sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
    
    # Lock the root account (disable root password login)
    passwd -l root
    
    # Remove root's authorized_keys
    rm -f /root/.ssh/authorized_keys
    
    # Restart SSH to apply changes
    systemctl restart sshd
    
    echo "Droplet setup complete! Root access has been disabled."
  EOF
}

# -----------------------------------------------------------------------------
# Cloudflare Global Load Balancer
# -----------------------------------------------------------------------------

# Health Monitor - checks if origins are healthy
resource "cloudflare_load_balancer_monitor" "app" {
  account_id     = var.cloudflare_account_id
  type           = "http"
  port           = 3000
  path           = "/health"
  expected_codes = "200"
  method         = "GET"
  interval       = 60
  retries        = 2
  timeout        = 5
  description    = "${var.app_name} health check"
}

# -----------------------------------------------------------------------------
# Dynamic Origin Pools
# -----------------------------------------------------------------------------

locals {
  # Coordinates for proximity steering
  region_coords = {
    eu   = { lat = 50.1109, lon = 8.6821 }     # Frankfurt
    na   = { lat = 40.7128, lon = -74.0060 }   # NYC
    asia = { lat = 1.3521, lon = 103.8198 }    # Singapore
    au   = { lat = -33.8688, lon = 151.2093 }  # Sydney
  }
}

resource "cloudflare_load_balancer_pool" "regions" {
  for_each = var.regions

  account_id = var.cloudflare_account_id
  name       = "${var.app_name}-pool-${each.key}"
  monitor    = cloudflare_load_balancer_monitor.app.id
  
  origins = [{
    name    = "${var.app_name}-${each.key}"
    address = digitalocean_droplet.app[each.key].ipv4_address
    enabled = true
    port    = 3000
  }]

  latitude  = local.region_coords[each.key].lat
  longitude = local.region_coords[each.key].lon
}

# -----------------------------------------------------------------------------
# Global Load Balancer
# -----------------------------------------------------------------------------

resource "cloudflare_load_balancer" "app" {
  zone_id       = var.cloudflare_zone_id
  name          = var.cloudflare_lb_hostname
  
  # Default to EU if all else fails
  fallback_pool = cloudflare_load_balancer_pool.regions["eu"].id
  
  # Include all regional pools
  default_pools = [for p in cloudflare_load_balancer_pool.regions : p.id]

  description     = "${var.app_name} global load balancer"
  proxied         = true
  ttl             = 30
  
  # "proximity" routes traffic to the physically closest pool based on lat/long
  # "dynamic_latency" is also a good option if you want to route based on network latency
  steering_policy = "proximity"
}



# -----------------------------------------------------------------------------
# Firewall
# -----------------------------------------------------------------------------

resource "digitalocean_firewall" "app" {
  name = "${var.app_name}-firewall"

  droplet_ids = [for droplet in digitalocean_droplet.app : droplet.id]

  # SSH access
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTP
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Application port
  inbound_rule {
    protocol         = "tcp"
    port_range       = "3000"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Allow all outbound traffic
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# -----------------------------------------------------------------------------
# Database Firewall Rules (Allow Droplets to Connect)
# -----------------------------------------------------------------------------

resource "digitalocean_database_firewall" "postgres" {
  cluster_id = digitalocean_database_cluster.postgres.id

  dynamic "rule" {
    for_each = digitalocean_droplet.app
    content {
      type  = "droplet"
      value = rule.value.id
    }
  }
}

resource "digitalocean_database_firewall" "valkey" {
  cluster_id = digitalocean_database_cluster.valkey.id

  dynamic "rule" {
    for_each = digitalocean_droplet.app
    content {
      type  = "droplet"
      value = rule.value.id
    }
  }
}

# =============================================================================
# GITHUB ACTIONS SECRETS
# =============================================================================
# These secrets are automatically set in your GitHub repository during
# terraform apply. No manual secret configuration needed!
# =============================================================================

# --- Droplet IPs ---
resource "github_actions_secret" "droplet_ip_eu" {
  repository      = var.github_repo
  secret_name     = "DROPLET_IP_EU"
  plaintext_value = digitalocean_droplet.app["eu"].ipv4_address
}

resource "github_actions_secret" "droplet_ip_na" {
  repository      = var.github_repo
  secret_name     = "DROPLET_IP_NA"
  plaintext_value = digitalocean_droplet.app["na"].ipv4_address
}

resource "github_actions_secret" "droplet_ip_asia" {
  repository      = var.github_repo
  secret_name     = "DROPLET_IP_ASIA"
  plaintext_value = digitalocean_droplet.app["asia"].ipv4_address
}

resource "github_actions_secret" "droplet_ip_au" {
  repository      = var.github_repo
  secret_name     = "DROPLET_IP_AU"
  plaintext_value = digitalocean_droplet.app["au"].ipv4_address
}

# --- Database URL ---
resource "github_actions_secret" "database_url" {
  repository      = var.github_repo
  secret_name     = "DATABASE_URL"
  plaintext_value = "postgresql://${digitalocean_database_user.app_user.name}:${digitalocean_database_user.app_user.password}@${digitalocean_database_cluster.postgres.host}:${digitalocean_database_cluster.postgres.port}/${digitalocean_database_db.app_db.name}?sslmode=require"
}

# --- Redis/Valkey Credentials ---
resource "github_actions_secret" "redis_host" {
  repository      = var.github_repo
  secret_name     = "REDIS_HOST"
  plaintext_value = digitalocean_database_cluster.valkey.host
}

resource "github_actions_secret" "redis_port" {
  repository      = var.github_repo
  secret_name     = "REDIS_PORT"
  plaintext_value = tostring(digitalocean_database_cluster.valkey.port)
}

resource "github_actions_secret" "redis_password" {
  repository      = var.github_repo
  secret_name     = "REDIS_PASSWORD"
  plaintext_value = digitalocean_database_cluster.valkey.password
}

# --- Container Registry ---
resource "github_actions_secret" "do_registry_token" {
  repository      = var.github_repo
  secret_name     = "DO_REGISTRY_TOKEN"
  plaintext_value = var.do_token
}

