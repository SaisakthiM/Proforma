variable "project_name" {
  description = "Base name used for every container, network and volume."
  type        = string
  default     = "proforma"
}

variable "environment" {
  description = "Environment suffix for resource names."
  type        = string
  default     = "prod"
}

variable "http_port" {
  description = "Host port that exposes the nginx gateway. This is the only published port."
  type        = number
  default     = 8080
}

variable "image_tag" {
  description = "Tag applied to the locally built API and gateway images."
  type        = string
  default     = "1.0.0"
}

variable "postgres_db" {
  description = "Database created inside the Postgres container."
  type        = string
  default     = "proforma"
}

variable "postgres_user" {
  description = "Postgres application user."
  type        = string
  default     = "proforma"
}

variable "postgres_password" {
  description = "Postgres password. Override this in terraform.tfvars for anything beyond a demo."
  type        = string
  sensitive   = true
  default     = "proforma"
}

variable "jwt_secret" {
  description = "HMAC secret for signing JWTs. Must be at least 32 characters."
  type        = string
  sensitive   = true
  default     = "proforma-demo-jwt-secret-please-change-me"

  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "jwt_secret must be at least 32 characters long."
  }
}

variable "seed_database" {
  description = "Load demo users, catalog, reviews, orders and events on API startup. Only runs when the database is empty."
  type        = bool
  default     = true
}

variable "cors_origins" {
  description = "Comma-separated browser origins allowed to call the API directly. Empty keeps same-origin only."
  type        = string
  default     = ""
}

variable "restart_policy" {
  description = "Docker restart policy for the application containers."
  type        = string
  default     = "unless-stopped"
}