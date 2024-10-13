
locals {
  ms_id        = var.ms_id
  app_id       = var.app_id
  compass_id   = var.compass_id
  default_tags_nullable = {
    "connecteddrive" = true
    "Creator"        = "Terraform"

    //Tags for Regions/Locations
    "Namespace"      = var.environment
    "Region"         = lower(var.region)
    "bmw:hub"        = var.region
    "bmw:env"        = var.environment

    //Tags for Applications and Microservices
    "bmw:ms-id"      = local.ms_id
    "bmw:app-id"     = local.app_id
    "bmw:compass-id" = local.compass_id

    //Tags for Cost Allocation
    "COST-TAG-1"     = upper(var.region)
    "COST-TAG-2"     = upper(var.environment)
    "COST-TAG-3"     = local.ms_id
    "APP-ID"         = local.app_id
  }
  default_tags = {
      for tag, value in local.default_tags_nullable :
      tag => value if value != null && value != ""
  }
}