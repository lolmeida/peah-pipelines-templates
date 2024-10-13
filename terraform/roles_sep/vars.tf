variable "aws_region" {
  description = "Region where we do the deploy"
  default = "eu-central-1"
}

variable "region" {
  description = "Region where we do the deploy (EMEA / US / CN)"
}

variable "environment" {
  description = "Environment where we do the deploy"
  default = "dev"
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Valid values for var: environment are (dev, prod)."
  }
}

variable "team" {
  description = "BMW Team"
  default     = "trm"
}

locals {
  bmw_environment = var.environment == "dev" ? "e2e" : var.environment
  terraform_tags = {
    Team = var.team
    Tool = "Terraform"
    "connecteddrive" = true
    "Creator" = "Terraform"

    //Tags for Regions/Locations
    "Namespace" = local.bmw_environment
    "Region" = lower(var.region)
    "bmw:hub" = var.region
    "bmw:env" = local.bmw_environment

    //Tags for Cost Allocation
    "COST-TAG-1" = upper(var.region)
    "COST-TAG-2" = upper(local.bmw_environment)
  }
}
