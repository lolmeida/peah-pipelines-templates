output "ecr_repository_url" {
  description = "The ecr host"
  value       = split("/", try(aws_ecr_repository.service_name_ecr.repository_url, "ECR_REPOSITORY_URL_NOT_SET"))[0]
}

output "ecr_registry_id" {
  description = "The ecr registry id"
  value       = try(aws_ecr_repository.service_name_ecr.registry_id, "ECR_REGISTRY_ID_NOT_SET")
}

output "ecr_name" {
  description = "The ecr name"
  value       = aws_ecr_repository.service_name_ecr.name
}