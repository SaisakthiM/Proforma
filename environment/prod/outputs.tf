output "storefront_url" {
  description = "Public entry point — the nginx gateway serves the React app and proxies the API."
  value       = "http://localhost:${var.http_port}"
}

output "gateway_health_url" {
  description = "Liveness probe served by nginx itself."
  value       = "http://localhost:${var.http_port}/healthz"
}

output "api_health_url" {
  description = "API health check. Reachable inside the Docker network as http://backend:8080/actuator/health."
  value       = "http://backend:8080/actuator/health"
}

output "backend_container" {
  description = "Internal-only Spring Boot container name."
  value       = docker_container.api.name
}

output "database_container" {
  description = "Internal-only Postgres container name (not published to the host)."
  value       = docker_container.db.name
}

output "network_name" {
  description = "Docker bridge network shared by the three services."
  value       = docker_network.main.name
}

output "volumes" {
  description = "Named volumes that survive container replacement."
  value = {
    database = docker_volume.pgdata.name
    uploads  = docker_volume.uploads.name
  }
}

output "demo_accounts" {
  description = "Seeded demo logins (password Proforma@123)."
  value = {
    buyer  = "ravi@proforma.dev"
    seller = "seller.kaveri@proforma.dev"
  }
}