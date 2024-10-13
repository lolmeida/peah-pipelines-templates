data "aws_caller_identity" "current" {}

locals {
  token_url = "atc-github.azure.cloud.bmw/_services/token"
  aws_partition = var.region == "CN" ? "aws-cn" : "aws"
  aws_account = data.aws_caller_identity.current.account_id
}

provider "aws" {
  region = var.aws_region
}

terraform {
  backend "s3" {
    encrypt = true
  }

  required_providers {
    aws = {
      version = "~> 5.0"
    }
  }
}

data "aws_iam_openid_connect_provider" "github_oidc_provider" {
  url = "https://${local.token_url}" # Created via shared terraform in shared library
}

data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github_oidc_provider.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.token_url}:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "${local.token_url}:sub"
      values   = [
        "repo:INFOTAIN/*:*"
      ]
    }
  }
}

resource "aws_iam_role" "am-github-ci" {
  name               = "am-github-ci"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json

  tags = merge(local.terraform_tags, {
    Name = "am-github-ci"
  })
}

resource "aws_iam_role_policy" "am-policy" {
  name   = "am-github-ci-policy"
  role   = aws_iam_role.am-github-ci.id
  policy = jsonencode({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
          "eks:ListClusters",
          "eks:DescribeCluster"
        ],
        "Effect": "Allow",
        "Resource": "*",
        "Sid": "AllowReadEksCluster"
      },
      {
        "Action": [
          "lambda:CreateFunction",
          "iam:UpdateAssumeRolePolicy",
          "iam:GetPolicyVersion",
          "lambda:TagResource",
          "iam:ListRoleTags",
          "iam:CreateRole",
          "iam:PutRolePolicy",
          "ssm:GetParameter",
          "iam:DetachRolePolicy",
          "iam:ListAttachedRolePolicies",
          "elasticache:IncreaseReplicaCount",
          "rds:ModifyDBClusterParameterGroup",
          "lambda:DeleteFunction",
          "events:RemoveTargets",
          "elasticache:ModifyReplicationGroup",
          "elasticache:DecreaseReplicaCount",
          "iam:ListRolePolicies",
          "events:ListTargetsByRule",
          "elasticache:DeleteCacheSubnetGroup",
          "iam:GetRole",
          "elasticache:DescribeReplicationGroups",
          "events:DescribeRule",
          "elasticache:RemoveTagsFromResource",
          "iam:GetPolicy",
          "lambda:InvokeFunction",
          "iam:ListEntitiesForPolicy",
          "lambda:GetPolicy",
          "iam:DeleteRole",
          "ssm:GetParameters",
          "elasticache:AddTagsToResource",
          "logs:CreateLogGroup",
          "lambda:GetFunctionCodeSigningConfig",
          "lambda:UpdateFunctionCode",
          "events:ListTagsForResource",
          "rds:CreateDBClusterParameterGroup",
          "elasticache:DescribeCacheClusters",
          "iam:GetRolePolicy",
          "rds:RemoveTagsFromResource",
          "elasticache:ListTagsForResource",
          "logs:ListTagsLogGroup",
          "lambda:ListVersionsByFunction",
          "events:PutRule",
          "iam:DeletePolicy",
          "elasticache:CreateReplicationGroup",
          "iam:ListInstanceProfilesForRole",
          "iam:PassRole",
          "iam:DeleteRolePolicy",
          "elasticache:DescribeCacheSubnetGroups",
          "elasticache:CreateCacheSubnetGroup",
          "iam:ListPolicyTags",
          "iam:CreatePolicyVersion",
          "rds:ResetDBClusterParameterGroup",
          "rds:AddTagsToResource",
          "rds:DescribeDBClusterParameters",
          "logs:DeleteLogGroup",
          "lambda:GetFunction",
          "lambda:UpdateFunctionConfiguration",
          "memorydb:TagResource",
          "iam:CreatePolicy",
          "backup:DescribeBackupVault",
          "events:DeleteRule",
          "events:PutTargets",
          "elasticache:DeleteReplicationGroup",
          "lambda:AddPermission",
          "iam:ListPolicyVersions",
          "rds:DeleteDBClusterParameterGroup",
          "logs:PutRetentionPolicy",
          "lambda:RemovePermission",
          "lambda:GetPolicy",
          "iam:DeletePolicyVersion",
          "elasticache:ModifyReplicationGroupShardConfiguration",
          "rds:DescribeDBClusterParameterGroups",
          "events:ListTargetsByRule",
          "logs:DescribeLogGroups",
          "sts:AssumeRole",
          "logs:ListTagsLogGroup",
          "SNS:TagResource",
          "events:TagResource",
          "logs:TagLogGroup"
        ],
        "Effect": "Allow",
        "Resource": [
          "arn:${local.aws_partition}:events:${var.aws_region}:${local.aws_account}:rule/ices-sep-*",
          "arn:${local.aws_partition}:logs:*:${local.aws_account}:log-group:/aws/lambda/ices-sep*",
          "arn:${local.aws_partition}:sns:${var.aws_region}:${local.aws_account}:ices-sep-memorydb-backup*",
          "arn:${local.aws_partition}:logs:*:${local.aws_account}:log-group:*",
          "arn:${local.aws_partition}:iam::${local.aws_account}:role/iis-ices-kubernetes-developer",
          "arn:${local.aws_partition}:logs:*:*:log-group:/aws/lambda/ices-trm-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:cluster/*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:acl/*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:subnetgroup/*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:user/*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:parametergroup/*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:snapshot/*",
          "arn:${local.aws_partition}:ssm:*:${local.aws_account}:parameter/ices/*",
          "arn:${local.aws_partition}:ssm:*:${local.aws_account}:parameter/infotain/*",
          "arn:${local.aws_partition}:lambda:*:*:function:ices-trm-*",
          "arn:${local.aws_partition}:backup:*:*:backup-vault:ices-*",
          "arn:${local.aws_partition}:iam::${local.aws_account}:policy/*ices-*",
          "arn:${local.aws_partition}:iam::${local.aws_account}:role/*ices-*",
          "arn:${local.aws_partition}:events:*:${local.aws_account}:rule/ices-trm-*",
          "arn:${local.aws_partition}:elasticache:*:${local.aws_account}:subnetgroup:ices-trm-*",
          "arn:${local.aws_partition}:elasticache:*:${local.aws_account}:cluster:ices-trm-*",
          "arn:${local.aws_partition}:elasticache:*:${local.aws_account}:replicationgroup:ices-trm-*",
          "arn:${local.aws_partition}:elasticache:*:${local.aws_account}:parametergroup:*",
          "arn:${local.aws_partition}:rds:*:${local.aws_account}:cluster-pg:*",
          "arn:${local.aws_partition}:lambda:*:${local.aws_account}:function:ices-*",
          "arn:${local.aws_partition}:events:*:${local.aws_account}:rule/ices-*",
          "arn:${local.aws_partition}:logs:*:${local.aws_account}:log-group::log-stream"
        ],
        "Sid": "VisualEditor0"
      },
      {
        "Action": [
          "memorydb:DeleteCluster",
          "memorydb:DeleteSnapshot",
          "memorydb:DeleteSubnetGroup",
          "memorydb:UpdateParameterGroup",
          "memorydb:UpdateUser",
          "memorydb:UpdateAcl",
          "memorydb:CreateCluster",
          "memorydb:CreateAcl",
          "memorydb:UntagResource",
          "memorydb:ListTags",
          "memorydb:DescribeSnapshots",
          "memorydb:DescribeUsers",
          "memorydb:DescribeParameterGroups",
          "memorydb:DeleteUser",
          "memorydb:DescribeAcls",
          "memorydb:TagResource",
          "memorydb:DescribeSubnetGroups",
          "memorydb:UpdateSubnetGroup",
          "memorydb:UpdateCluster",
          "memorydb:DeleteAcl",
          "memorydb:DescribeClusters",
          "memorydb:DescribeParameters",
          "memorydb:CreateSnapshot",
          "memorydb:DeleteParameterGroup",
          "s3:*"
        ],
        "Effect": "Allow",
        "Resource": [
          "arn:${local.aws_partition}:s3:::ices-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:reservednode/ices-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:reservednode/mandalor-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:acl/ices-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:acl/mandalor-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:acl/memorydb-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:user/ices-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:user/mandalor-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:cluster/ices-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:cluster/mandalor-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:subnetgroup/*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:parametergroup/ices-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:parametergroup/*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:snapshot/ices-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:snapshot/mandalor-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:function:ices-*",
          "arn:${local.aws_partition}:memorydb:*:${local.aws_account}:rule/ices-*"
        ],
        "Sid": "VisualEditor1"
      },
      {
        "Action": [
          "events:DescribeRule",
          "events:ListTagsForResource",
          "SNS:GetTopicAttributes",
          "SNS:ListTagsForResource",
          "SNS:GetSubscriptionAttributes",
          "EC2:DescribeVpcAttribute",
          "iam:ListPolicies",
          "memorydb:DescribeEvents",
          "lambda:ListFunctions",
          "iam:UntagRole",
          "memorydb:CreateUser",
          "memorydb:CreateSubnetGroup",
          "iam:ListRoles",
          "s3:GetBucketAcl",
          "s3:GetBucketWebsite",
          "s3:GetBucketVersioning",
          "s3:GetBucketRequestPayment",
          "s3:GetBucketLogging",
          "Lambda:GetFunction",
          "Lambda:ListVersionsByFunction",
          "Lambda:GetFunctionCodeSigningConfig",
          "lambda:UntagResource",
          "ec2:DescribeSecurityGroups",
          "memorydb:CreateParameterGroup",
          "s3:ListAllMyBuckets",
          "s3:GetBucketCors",
          "s3:GetLifecycleConfiguration",
          "ec2:DescribeVpcs",
          "memorydb:DescribeEngineVersions",
          "sts:GetCallerIdentity",
          "ec2:DescribeSubnets",
          "logs:DescribeLogGroups"
        ],
        "Effect": "Allow",
        "Resource": "*",
        "Sid": "VisualEditor2"
      },
      {
        "Action": "s3:ListAllMyBuckets",
        "Effect": "Allow",
        "Resource": "arn:${local.aws_partition}:s3:::ices-*",
        "Sid": "VisualEditor3"
      },
      {
        "Action": "backup:*",
        "Effect": "Allow",
        "Resource": "arn:${local.aws_partition}:backup:*:*:backup-vault:ices-*",
        "Sid": "VisualEditor4"
      },
      {
        "Action": [
          "s3:PutAccountPublicAccessBlock",
          "s3:GetAccountPublicAccessBlock"
        ],
        "Effect": "Allow",
        "Resource": "arn:${local.aws_partition}:s3::*:ices-*",
        "Sid": "VisualEditor5"
      },
      {
        "Effect": "Allow",
        "Action": [
          "ecr:CreateRepository",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:DescribeImages",
          "ecr:DescribeRepositories",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:ListImages",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
          "ecr:GetAuthorizationToken",
          "ecr:ListTagsForResource",
          "ecr:GetLifecyclePolicy",
          "ecr:GetRepositoryPolicy",
          "ecr:TagResource",
          "ecr:SetRepositoryPolicy",
          "ecr:PutLifecyclePolicy"
        ],
        "Sid": "ECR",
        "Resource": "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "am-services-policy" {
  name = "am-services-policy"
  role = aws_iam_role.am-github-ci.id
  policy = jsonencode({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "VisualEditor0",
        "Effect": "Allow",
        "Action": [
          "dynamodb:CreateTable",
          "dynamodb:UpdateTimeToLive",
          "dynamodb:TagResource",
          "dynamodb:DescribeTable",
          "dynamodb:DescribeContinuousBackups",
          "dynamodb:ListTagsOfResource",
          "dynamodb:DescribeTimeToLive",
          "dynamodb:UpdateTable",
          "dynamodb:UpdateContinuousBackups",
          "dynamodb:ListTables",
          "dynamodb:DescribeReservedCapacity",
          "dynamodb:DescribeLimits"
        ],
        "Resource": "arn:${local.aws_partition}:dynamodb:*:${local.aws_account}:table/ices-experience-event-service-*"
      },
      {
        "Sid": "VisualEditor1",
        "Effect": "Allow",
        "Action": [
          "pricing:DescribeServices",
          "application-autoscaling:*",
          "cloudtrail:PutEventSelectors",
          "cloudtrail:ListTrails",
          "rds:*",
          "pricing:GetPriceListFileUrl",
          "cloudtrail:GetEventSelectors",
          "pricing:GetProducts",
          "iam:*",
          "pricing:ListPriceLists",
          "pricing:GetAttributeValues",
          "secretsmanager:*",
          "cloudwatch:*",
          "kms:*",
          "cloudtrail:CreateTrail",
          "ec2:*"
        ],
        "Resource": [
          "arn:${local.aws_partition}:secretsmanager:*:${local.aws_account}:sep-experience-trigger-service-*",
          "*",
          "arn:${local.aws_partition}:ec2:*:${local.aws_account}:sep-experience-trigger-service-*",
          "arn:${local.aws_partition}:cloudwatch:*:${local.aws_account}:sep-experience-trigger-service-*"
        ]
      },
      {
        "Sid": "VisualEditor2",
        "Effect": "Allow",
        "Action": "rds:*",
        "Resource": "arn:${local.aws_partition}:rds:*:${local.aws_account}:cluster-pg:cluster-pg-sep-experience-trigger-service-*"
      },
      {
        "Sid": "VisualEditor3",
        "Effect": "Allow",
        "Action": "iam:*",
        "Resource": [
          "arn:${local.aws_partition}:iam::${local.aws_account}:role/sep-experience-trigger-*",
          "arn:${local.aws_partition}:iam::${local.aws_account}:role/experience-trigger-*"
        ]
      },
      {
        "Sid": "VisualEditor4",
        "Effect": "Allow",
        "Action": [
          "ecr:*"
        ],
        "Resource": "*"
      },
      {
        "Sid": "VisualEditor5",
        "Effect": "Allow",
        "Action": "iam:*",
        "Resource": [
          "arn:${local.aws_partition}:iam::${local.aws_account}:role/ices-experience-event-*",
          "arn:${local.aws_partition}:iam::${local.aws_account}:policy/ices-experience-event-*",
          "arn:${local.aws_partition}:iam::*:policy/AdministratorAccess"
        ]
      },
      {
        "Sid": "VisualEditor6",
        "Effect": "Allow",
        "Action": "kms:*",
        "Resource": "arn:${local.aws_partition}:kms:*:${local.aws_account}:sep-experience-trigger-service-*"
      },
      {
        "Sid": "VisualEditor7",
        "Effect": "Allow",
        "Action": "lambda:*",
        "Resource": "arn:${local.aws_partition}:lambda:*:${local.aws_account}:function:sep-mdl-*"
      },
      {
        "Sid": "VisualEditor8",
        "Effect": "Allow",
        "Action": "sns:*",
        "Resource": [
          "arn:${local.aws_partition}:sns:*:${local.aws_account}:sep-mdl-*",
          "arn:${local.aws_partition}:sns:*:${local.aws_account}:ices-*"
        ]
      },
      {
        "Sid": "VisualEditor9",
        "Effect": "Allow",
        "Action": "sqs:*",
        "Resource": "arn:${local.aws_partition}:sqs:*:${local.aws_account}:sep-mdl-*"
      }
    ]
  })
}