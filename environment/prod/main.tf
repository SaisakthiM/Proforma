locals {
  name_prefix   = "${var.project_name}-${var.environment}"
  repo_root     = abspath("${path.module}/../..")
  api_image     = "${local.name_prefix}-api:${var.image_tag}"
  gateway_image = "${local.name_prefix}-gateway:${var.image_tag}"
  cors_origins  = var.cors_origins == "" ? "http://localhost:${var.http_port}" : var.cors_origins

  # Rebuilding the images is part of the stack: a source change replaces the
  # image instead of leaving a stale container running.
  api_source_hash = sha256(join("", concat(
    [
      filesha256("${local.repo_root}/projects/backend/pom.xml"),
      filesha256("${local.repo_root}/projects/backend/Dockerfile"),
    ],
    [
      for f in sort(fileset("${local.repo_root}/projects/backend/src", "**")) :
      filesha256("${local.repo_root}/projects/backend/src/${f}")
    ]
  )))

  gateway_source_hash = sha256(join("", concat(
    [
      filesha256("${local.repo_root}/projects/frontend/package.json"),
      filesha256("${local.repo_root}/projects/frontend/index.html"),
      filesha256("${local.repo_root}/projects/frontend/vite.config.js"),
      filesha256("${local.repo_root}/projects/gateway/nginx.conf"),
      filesha256("${local.repo_root}/projects/gateway/Dockerfile"),
      filesha256("${local.repo_root}/projects/gateway/errors/404.html"),
      filesha256("${local.repo_root}/projects/gateway/errors/503.html"),
    ],
    [
      for f in sort(fileset("${local.repo_root}/projects/frontend/src", "**")) :
      filesha256("${local.repo_root}/projects/frontend/src/${f}")
    ],
    [
      for f in sort(fileset("${local.repo_root}/projects/frontend/public", "**")) :
      filesha256("${local.repo_root}/projects/frontend/public/${f}")
    ]
  )))
}

resource "docker_network" "main" {
  name   = "${local.name_prefix}-net"
  driver = "bridge"
}

resource "docker_volume" "pgdata" {
  name = "${local.name_prefix}-pgdata"
}

resource "docker_volume" "uploads" {
  name = "${local.name_prefix}-uploads"
}

resource "docker_image" "postgres" {
  name         = "postgres:16-alpine"
  keep_locally = true
}

resource "docker_image" "api" {
  name         = local.api_image
  keep_locally = true

  build {
    context    = local.repo_root
    dockerfile = "projects/backend/Dockerfile"
  }

  triggers = {
    source = local.api_source_hash
  }
}

resource "docker_image" "gateway" {
  name         = local.gateway_image
  keep_locally = true

  build {
    context    = local.repo_root
    dockerfile = "projects/gateway/Dockerfile"
    args = {
      VITE_API_URL = ""
    }
  }

  triggers = {
    source = local.gateway_source_hash
  }
}

resource "docker_container" "db" {
  name       = "${local.name_prefix}-db"
  image      = docker_image.postgres.image_id
  restart    = var.restart_policy
  wait       = true
  wait_timeout = 120

  env = [
    "POSTGRES_DB=${var.postgres_db}",
    "POSTGRES_USER=${var.postgres_user}",
    "POSTGRES_PASSWORD=${var.postgres_password}",
    "PGDATA=/var/lib/postgresql/data/pgdata",
    "TZ=UTC",
  ]

  volumes {
    container_path = "/var/lib/postgresql/data"
    volume_name    = docker_volume.pgdata.name
  }

  networks_advanced {
    name    = docker_network.main.name
    aliases = ["db"]
  }

  healthcheck {
    test         = ["CMD-SHELL", "pg_isready -U ${var.postgres_user} -d ${var.postgres_db} || exit 1"]
    interval     = "10s"
    timeout      = "5s"
    retries      = 12
    start_period = "20s"
  }
}

resource "docker_container" "api" {
  name       = "${local.name_prefix}-api"
  image      = docker_image.api.image_id
  restart    = var.restart_policy
  wait       = true
  wait_timeout = 180

  env = [
    "SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/${var.postgres_db}",
    "SPRING_DATASOURCE_USERNAME=${var.postgres_user}",
    "SPRING_DATASOURCE_PASSWORD=${var.postgres_password}",
    "SPRING_DATASOURCE_HIKARI_INITIALIZATION_FAIL_TIMEOUT=60000",
    "APP_JWT_SECRET=${var.jwt_secret}",
    "APP_SEED_ENABLED=${var.seed_database}",
    "APP_CORS_ORIGINS=${local.cors_origins}",
    "APP_UPLOADS_DIR=/app/uploads",
    "TZ=UTC",
  ]

  volumes {
    container_path = "/app/uploads"
    volume_name    = docker_volume.uploads.name
  }

  networks_advanced {
    name    = docker_network.main.name
    aliases = ["backend"]
  }

  depends_on = [docker_container.db]

  healthcheck {
    test         = ["CMD-SHELL", "wget -qO- http://127.0.0.1:8080/actuator/health | grep -q UP || exit 1"]
    interval     = "15s"
    timeout      = "5s"
    retries      = 10
    start_period = "60s"
  }
}

resource "docker_container" "gateway" {
  name       = "${local.name_prefix}-gateway"
  image      = docker_image.gateway.image_id
  restart    = var.restart_policy
  wait       = true
  wait_timeout = 60

  ports {
    internal = 80
    external = var.http_port
  }

  networks_advanced {
    name    = docker_network.main.name
    aliases = ["gateway"]
  }

  depends_on = [docker_container.api]

  healthcheck {
    test         = ["CMD-SHELL", "wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1"]
    interval     = "15s"
    timeout      = "5s"
    retries      = 5
    start_period = "15s"
  }
}