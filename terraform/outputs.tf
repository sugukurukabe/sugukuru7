output "api_url" {
  value = google_cloud_run_service.api.status[0].url
}

output "web_url" {
  value = google_cloud_run_service.web.status[0].url
}

output "db_instance_ip" {
  value = google_sql_database_instance.instance.private_ip_address
}
