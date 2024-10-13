variable "service_name" {
  description = "The service name"
}

variable "aws_region" {
  description = "The aws region to create the resources on"
}

variable "env_abbreviation" {
  description = "Environment abbreviation for deployment"
  default = "GLOBAL"
}

variable "region" {
  description = "Region [EMEA, US, CN]"
  default = ""
}

variable "tag_mutability" {
  description = "ECR image tag mutability (MUTABLE|IMMUTABLE)"
  default = "MUTABLE"
}

variable "release_candidate_prefix" {
  description = "The release candidate prefix"
}

variable "hotfix_prefix" {
  description = "The hotfix prefix"
}

variable "tags" {
  description = "ECR specific Tags"
  type        = map(string)
  default = {}
}