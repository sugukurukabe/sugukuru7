variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "sugukuru7"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-northeast1"
}

variable "db_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_password" {
  description = "Database password for sugukuru_admin"
  type        = string
  sensitive   = true
}

variable "tester_email" {
  description = "Email of the tester to grant access"
  type        = string
  default     = "a_kabe@sugu-kuru.co.jp"
}
