terraform {
  required_version = ">= 1.5.0"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }

  # Local state is intentional for a single-host demo stack. For a shared
  # deployment, swap this for an S3/GCS/AzureRM backend and lock the state.
  backend "local" {}
}

provider "docker" {}