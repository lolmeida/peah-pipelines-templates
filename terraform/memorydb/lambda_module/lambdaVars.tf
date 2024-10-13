variable "team" {
  default     = "infotain"
  description = "The team creating the dedicated resource [avs, ices-trm, ices, ccis]."
}

variable "environment" {
  default     = "test"
  description = "The environment to create the resources on [test, int, e2e, prod]."
}

variable "region" {
  description = "Region [EMEA, US, CN]."
  default     = "EMEA"
}

variable "aws_region" {
  default     = "eu-central-1"
  description = "The aws region to create the resources on [eu-central-1, us-east-1, cn-north-1]."
}

variable "cluster_identity" {
  default     = "memory-db"
  description = "The identity of the memorydb cluster. This is stored as a lowercase string."
}

variable "sns_users" {
  type        = string
  description = "Emails to subscribe SNS in case of Lambda failure separated by space"
}

variable "bucket_id" {
  default     = "memorydb-backup"
  description = "The bucket identifier."
}

variable "sns_topic_id" {
  default     = "lambda-dlq"
  description = "The sns identifier to be used in the dead letter queue."
}

variable "arn_region" {
  default     = "aws"
  description = "AWS ARN region for IAM Roles."
}

variable "email_domain" {
  default     = "@criticaltechworks.com"
  description = "The domain to be appended to the users"
}

variable "event_rule_schedule" {
  default     = "cron(45 23 * * ? *)"
  description = "The schedule expression to trigger the MemoryDB Backup Lambda function."
}

variable "snapshot_retention_limit" {
  description = "Number of days for which MemoryDB will retain automatic snapshots before deleting them. To disable backups we need to set the value to 0."
}

variable "default_tags" {
  type        = map(string)
  description = "The Map with default tags"
}
