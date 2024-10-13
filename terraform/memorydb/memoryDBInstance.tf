provider "aws" {
  region = var.aws_region
}

terraform {
  backend "s3" {
    encrypt = "true"
  }
}

data "aws_vpc" "orbit_product_vpc" {
  filter {
    name   = "tag:bmw:ManagedBy"
    values = [var.vpc_managed_by]
  }

  filter {
    name   = "tag:bmw:hub"
    values = [var.region]
  }

  filter {
    name   = "tag:Name"
    values = [var.product_vpc_name]
  }
}

data "aws_vpc" "orbit_service_vpc" {
  filter {
    name   = "tag:bmw:ManagedBy"
    values = [var.vpc_managed_by]
  }

  filter {
    name   = "tag:bmw:hub"
    values = [var.region]
  }

  filter {
    name   = "tag:Name"
    values = [var.service_vpc_name]
  }
}

data "aws_subnets" "orbit_resources_private_subnets" {

  filter {
    name   = "tag:bmw:project"
    values = [var.vpc_managed_by]
  }

  filter {
    name   = "tag:bmw:env"
    values = [upper(var.environment)]
  }

  filter {
    name   = "tag:bmw:hub"
    values = [var.region]
  }

  filter {
    name   = "tag:vpc-type"
    values = [var.vpc_type]
  }

  filter {
    name   = "tag:subnet-type"
    values = [var.vpc_subnet_type]
  }

  filter {
    name   = "availabilityZone"
    values = var.availability_zones
  }
}

resource "aws_security_group" "cache_security_group" {

  name        = "${var.team}-${var.security_group_name}-${var.environment}"
  description = "Allow inbound and outbound traffic from Product and Service VPC"
  vpc_id      = data.aws_vpc.orbit_product_vpc.id
  tags        = tomap(merge(local.default_tags, { Name = "${var.team}-${var.security_group_name}-${var.environment}" }))

  ingress {
    description = "Allow inbound traffic from Service VPC"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.orbit_service_vpc.cidr_block]
  }

  egress {
    description = "Allow outbound traffic to Service VPC"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.orbit_service_vpc.cidr_block]
  }

}

resource "aws_memorydb_subnet_group" "memorydb_subnet_group" {
  name       = "${var.team}-${var.subnet_group_name}-${var.environment}"
  subnet_ids = data.aws_subnets.orbit_resources_private_subnets.ids
  tags       = tomap(merge(local.default_tags, { Name = "${var.team}-${var.subnet_group_name}-${var.environment}" }))
}

resource "aws_memorydb_cluster" "memorydb_cluster_group" {
  name        = "${var.team}-${var.cluster_identity}-${var.environment}"
  description = "${var.team} ${var.cluster_identity_description} ${var.environment}"
  tags        = tomap(merge(local.default_tags, { Name = "${var.team}-${var.cluster_identity}-${var.environment}" }))

  #engine_version             = var.engine_version
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  node_type                  = var.node_type
  num_shards                 = var.number_of_shards
  num_replicas_per_shard     = var.number_of_replicas_by_shard

  tls_enabled              = var.tls_enabled
  subnet_group_name        = aws_memorydb_subnet_group.memorydb_subnet_group.name
  security_group_ids       = ["${aws_security_group.cache_security_group.id}"]
  maintenance_window       = var.maintenance_window
  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window          = var.snapshot_window
  acl_name                 = aws_memorydb_acl.memorydb_acl_group.name
}

resource "aws_memorydb_parameter_group" "memorydb_parameter_group" {
  name        = "${var.team}-${var.parameter_group_name}-${var.environment}"
  description = var.parameter_group_description
  tags        = tomap(merge(local.default_tags, { Name = "${var.team}-${var.parameter_group_name}-${var.environment}" }))
  family      = var.parameter_group_family
}

resource "aws_memorydb_user" "memorydb_user_group" {
  user_name     = var.user_group_name
  access_string = var.user_group_access_string
  tags          = tomap(merge(local.default_tags, { Name = "${var.team}-${var.parameter_group_name}-${var.environment}" }))

  authentication_mode {
    type      = var.authentication_type
    passwords = [var.authentication_pass]
  }
}

resource "aws_memorydb_acl" "memorydb_acl_group" {
  name       = format("%s-%s-%s", var.team, var.acl_group_name, var.environment)
  user_names = [aws_memorydb_user.memorydb_user_group.user_name]
  tags       = tomap(merge(local.default_tags, { Name = format("%s-%s-%s", var.team, var.acl_group_name, var.environment) }))
}

module "s3backup_module" {
  count = var.create_s3_backup ? 1 : 0

  source                   = "./s3Backup_module"
  team                     = var.team
  region                   = var.region
  environment              = var.environment
  aws_region               = var.aws_region
  arn_region               = var.aws_region != "cn-north-1" ? "aws" : "aws-cn"
  sns_users                = var.sns_users
  event_rule_schedule      = var.event_rule_schedule
  snapshot_retention_limit = var.snapshot_retention_limit
  default_tags             = local.default_tags
}