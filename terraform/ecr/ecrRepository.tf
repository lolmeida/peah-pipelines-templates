provider "aws" {
  region = var.aws_region
}

terraform {
  backend "s3" {
    encrypt = "true"
  }
}

data "aws_iam_policy_document" "ecr_repository_policy" {
  source_policy_documents = [file("policies/${var.aws_region}/policy.json")]
}

resource "aws_ecr_repository" "service_name_ecr" {
  name = var.service_name

  image_scanning_configuration {
    scan_on_push = true
  }

  image_tag_mutability = var.tag_mutability

  tags = merge({"bmw:hub" = var.region,
    "bmw:env" = upper(var.env_abbreviation),
    "bmw:app-id" = "APP-3345",
    "bmw:app-name" = "ConnectedDrive Platform",
    "COST TAG 1" = var.region,
    "COST TAG 2" = upper(var.env_abbreviation),
    "APP-ID" = "APP-3345",
    "Cost Center" = "7236",
    "Product ID" = "SWP-2121"},
    var.tags)
}

resource "aws_ecr_repository_policy" "service_name_ecr_repo_policy" {
  repository = aws_ecr_repository.service_name_ecr.name

  policy = data.aws_iam_policy_document.ecr_repository_policy.json
}

resource "aws_ecr_lifecycle_policy" "service_name_ecr_life_policy" {
  repository = aws_ecr_repository.service_name_ecr.name

  policy = <<EOF
{
  "rules": [
    {
      "action": {
        "type": "expire"
      },
      "selection": {
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 1,
        "tagStatus": "untagged"
      },
      "description": "Expire untagged images",
      "rulePriority": 10
    },
    {
      "action": {
        "type": "expire"
      },
      "selection": {
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 1,
        "tagStatus": "tagged",
        "tagPrefixList": [
          "feature"
        ]
      },
      "description": "Expire feature branches images",
      "rulePriority": 20
    },
    {
      "action": {
        "type": "expire"
      },
      "selection": {
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 20,
        "tagStatus": "tagged",
        "tagPrefixList": [
          "${var.release_candidate_prefix}","${var.hotfix_prefix}"
        ]
      },
      "description": "Expire release candidates images",
      "rulePriority": 25
    },
    {
      "action": {
        "type": "expire"
      },
      "selection": {
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 1,
        "tagStatus": "tagged",
        "tagPrefixList": [
          "bugfix"
        ]
      },
      "description": "Expire bugfix branches images",
      "rulePriority": 30
    },
    {
      "action": {
        "type": "expire"
      },
      "selection": {
        "countType": "imageCountMoreThan",
        "countNumber": 1,
        "tagStatus": "tagged",
        "tagPrefixList": [
          "develop-", "main"
        ]
      },
      "description": "Expire old develop branch images",
      "rulePriority": 50
    }
  ]
}
EOF
}
