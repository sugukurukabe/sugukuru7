resource "google_sql_database_instance" "instance" {
  name             = "sugukuru7-db"
  region           = var.region
  database_version = "POSTGRES_15"
  
  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = var.db_tier
    ip_configuration {
      ipv4_enabled    = true
      private_network = google_compute_network.vpc_network.id
      authorized_networks {
        name  = "agent-ip"
        value = "125.31.69.19"
      }
    }
    backup_configuration {
      enabled = true
    }
  }
  deletion_protection = false # 開発用。本番は true に。
}

resource "google_sql_database" "database" {
  name     = "sugukuru"
  instance = google_sql_database_instance.instance.name
}

resource "google_sql_user" "users" {
  name     = "sugukuru_admin"
  instance = google_sql_database_instance.instance.name
  password = var.db_password
}
