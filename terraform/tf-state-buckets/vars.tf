variable "s3_bucket_name" {
  description = "Name of S3 state bucket"
  default = "ices-trm-infra-tfstate-v1"
}

variable "dynamodb_table_name" {
  description = "Name of DynamoDB state lock table"
  default = "ices-trm-infra-tfstate-lock"
}

variable "account_ids" {
  description = "The account ids that can assume the role of consulting terraform state"
  type = list(string)
}