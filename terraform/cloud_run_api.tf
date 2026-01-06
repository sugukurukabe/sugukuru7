resource "google_cloud_run_service" "api" {
  name     = "sugukuru-api"
  location = var.region

  template {
    spec {
      containers {
        image = "asia-northeast1-docker.pkg.dev/${var.project_id}/sugukuru/sugukuru-api:latest" # Placeholder
        resources {
          limits = {
            cpu    = "1"
            memory = "1Gi"
          }
        }
        env {
          name  = "DATABASE_URL"
          value = "postgresql+asyncpg://sugukuru_admin:${var.db_password}@${google_sql_database_instance.instance.private_ip_address}:5432/sugukuru"
        }
        env {
          name  = "GCS_BUCKET"
          value = google_storage_bucket.documents.name
        }
      }
    }
    metadata {
      annotations = {
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.name
        "run.googleapis.com/vpc-access-egress"    = "all-traffic"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

resource "google_cloud_run_service_iam_member" "api_public" {
  service  = google_cloud_run_service.api.name
  location = google_cloud_run_service.api.location
  role     = "roles/run.invoker"
  member   = "domain:sugu-kuru.co.jp"
}
