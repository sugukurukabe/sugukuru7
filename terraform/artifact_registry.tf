resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "sugukuru"
  description   = "Docker repository for SUGUKURU"
  format        = "DOCKER"
}
