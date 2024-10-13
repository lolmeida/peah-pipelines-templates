variable "aws_region" {
  default     = "eu-central-1"
  description = "The aws region to create the resources on [eu-central-1, us-east-1, cn-north-1]."
}

variable "team" {
  description = "The team creating the dedicated resource [avs, ices-trm, ices, ccis]."
}

variable "region" {
  description = "Region [EMEA, US, CN]."
  default     = "EMEA"
}

variable "environment" {
  default     = "test"
  description = "The environment to create the resources on [test, int, e2e, prod]."
}

variable "cluster_identity" {
  default     = "memory-db"
  description = "The identity of the memorydb cluster. This is stored as a lowercase string."
}

variable "cluster_identity_description" {
  default     = "memorydb cluster"
  description = "A user-created description for the cluster."
}

variable "node_type" {
  default     = "db.t4g.small"
  description = "The compute and memory capacity of the nodes."
}

variable "parameter_group_name" {
  default     = "parameter-group"
  description = "Name of the parameter group to associate with this cache cluster."
}

variable "port" {
  default     = 6379
  description = "The port number where MemoryDB will listen for requests."
}

variable "engine" {
  default     = "redis"
  description = "Name of the cache engine to be used for this cache cluster. Valid values for this parameter are memcached or redis."
}

variable "engine_version" {
  default     = "6.x"
  description = "Version number of the cache engine to be used."
}

variable "subnet_group_name" {
  default     = "memorydb-subnet-group"
  description = "The subnet group which contains the subnets that will be used by MemoryDB."
}

variable "security_group_name" {
  default     = "memorydb_security_group"
  description = "VPC security group associated with the MemoryDB cache cluster."
}

variable "number_of_replicas_by_shard" {
  default     = 0
  description = "Specify the number of replica nodes in each node group. Valid values are 0 to 5. Changing this number will force a new resource."
}

variable "number_of_shards" {
  default     = 1
  description = "Specify the number of node groups (shards) for this MemoryDB replication group. Changing this number will trigger an online resizing operation before other settings modifications. This number can't be higher than the number of availability zones."
}

variable "vpc_managed_by" {
  default     = "Orbit"
  description = "The project managing the VPC. Used in the ManagedBy tag."
}

variable "product_vpc_name" {
  default     = "product-resources-iis-test"
  description = "The name tag of the product resources VPC."
}

variable "service_vpc_name" {
  default     = "iis-test"
  description = "The name tag of the service resources VPC."
}

variable "vpc_type" {
  default     = "product-resources"
  description = "The type tag of the vpc."
}

variable "vpc_subnet_type" {
  default     = "private"
  description = "Subnet type tag."
}

variable "arn_region" {
  default     = "aws"
  description = "AWS ARN region for IAM Roles."
}

variable "multi_az_enabled" {
  default     = "true"
  description = "Specifies whether to enable Multi-AZ Support for the replication group."
}

variable "auto_minor_version_upgrade" {
  default     = true
  description = "Specifies whether to automatically upgrade the MemoryDB cluster to the latest minor version. Set to 'true' to enable automatic upgrades, or 'false' to disable them. Note that enabling automatic upgrades can result in downtime and may cause compatibility issues with your applications if they depend on specific versions of the MemoryDB cluster."
}

variable "tls_enabled" {
  default     = true
  description = "Specifies whether to enable Transport Layer Security (TLS) encryption for the cluster. Set to 'true' to enable TLS encryption, or 'false' to disable it. Note that enabling TLS encryption requires a valid SSL/TLS certificate and may incur additional costs."
}

variable "maintenance_window" {
  default     = "sun:23:00-mon:01:30"
  description = "The maintenance window for the MemoryDB cluster. Specify a range of times, in UTC, during which system maintenance tasks can be performed on the cluster without impacting availability. The format should be 'ddd:hh:mm-ddd:hh:mm', where 'ddd' is the three-letter abbreviation for the day of the week, 'hh' is the hour in 24-hour format, and 'mm' is the minute."
}

variable "snapshot_retention_limit" {
  description = "(Mandatory) Number of days for which MemoryDB will retain automatic snapshots before deleting them. To disable backups we need to set the value to 0."
}

variable "snapshot_window" {
  default     = "21:00-23:00"
  description = "Daily time range (in UCT) during which MemoryDB will begin taking an automatic snapshot."
}

variable "parameter_group_description" {
  default     = "MemoryDB parameter group"
  description = "Description of the MemoryDB group."
}

variable "parameter_group_family" {
  default     = "memorydb_redis6"
  description = "The name of the parameter group family for the cluster. This determines the set of parameters that can be configured for the cluster."
}

variable "user_group_name" {
  description = "The name of the user group to be created in the MemoryDB cluster. User groups are used to manage access control for users of the cluster. The name must be unique and cannot be changed after creation."
}

variable "user_group_access_string" {
  default     = "on ~* &* +@all"
  description = "A string representing the access privileges for the user group. This string should be formatted as a comma-separated list of key-value pairs, where the keys represent the names of resources to be granted access to (e.g., 'clusters', 'nodes', 'parameters'), and the values represent the access levels to be granted (e.g., 'read', 'write', 'execute'). For example: 'clusters=read, nodes=execute, parameters=write'. Note that the available keys and values may depend on the specific version of MemoryDB that you are using."
}

variable "authentication_type" {
  default     = "password"
  description = "The authentication method to use for the MemoryDB cluster. Possible values are 'none' (no authentication), 'password' (password-based authentication), and 'tls' (TLS client authentication). Note that not all authentication methods may be supported by all versions of MemoryDB."
}

variable "authentication_pass" {
  description = "The password to use for password-based authentication. This value is sensitive and will not be displayed in logs or output. Note that this parameter is required if the authentication_type is set to 'password', and should be left empty if a different authentication method is used."
}

variable "acl_group_name" {
  default     = "memorydb-acl"
  description = "The name of the Access Control List (ACL) group to create for the MemoryDB cluster. An ACL group is a collection of rules that define access permissions for a group of clients or IP addresses. The name of the group must be unique within the cluster."
}

variable "availability_zones" {
  default     = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
  description = "Availability zones for the target region."
}

variable "create_s3_backup" {
  default     = false
  description = "(Optional) Whether to create or not the s3 backup for MemoryDB snapshot."
}

variable "sns_users" {
  type        = string
  description = "Emails to subscribe SNS in case of Lambda failure"
}

variable "event_rule_schedule" {
  default     = "cron(45 23 * * ? *)"
  description = "The schedule expression to trigger the MemoryDB Backup Lambda function."
}

variable "ms_id" {
  description = "The microservice id."
  default = null
}

variable "app_id" {
  description = "The application id."
  default = null
}

variable "compass_id" {
  description = "The compass id."
  default = null
}