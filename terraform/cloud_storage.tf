resource "google_storage_bucket" "documents" {
  name     = "sugukuru7-documents"
  location = var.region
  
  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
}
