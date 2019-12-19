variable "bucket" {
  default = "record.videos.omny.ca"
}

variable "db_bucket" {
  default = "db.videos.omny.ca"
}

variable "image_bucket" {
  default = "show-images.omny.ca"
}

variable "metadata_user_bucket" {
  default = "maestro-images.omny.ca"
}

variable "metadata_source_bucket" {
  default = "metadata-images.omny.ca"
}

variable "tmdb_key" {
  type = string
}

variable "deployment_bucket" {
  default = "lambda-deployments.omny.ca"
}

variable "access_token" {
  type = string
}

variable "domain" {
  default = "api.maestromediacenter.com"
}

variable "admin_domain" {
  default = "adminapi.maestromediacenter.com"
}

variable "main_maestro_account" {
  type = string
}

variable "route53_zone" {
  default = "Z2W1P7ODHGBTCH"
}

