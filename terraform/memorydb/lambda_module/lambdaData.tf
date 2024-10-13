###################
# Lambda Function #
###################
data "archive_file" "python_lambda_package" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_function.zip"
}

data "aws_caller_identity" "current_account" {}

#######
# IAM #
#######
data "aws_iam_policy_document" "lambda_service_assume_role_policy" {
  statement {
    sid     = "AssumeServiceRole"
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com", "sns.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_function_policy" {
  statement {
    sid     = "MemorydbPermission"
    actions = [
      "memorydb:DescribeSnapshots",
      "memorydb:CopySnapshot"
    ]
    effect    = "Allow"
    resources = [
      "arn:${var.arn_region}:memorydb:*:*:cluster/${var.team}-*",
      "arn:${var.arn_region}:memorydb:*:*:snapshot/automatic.${var.team}-*"
    ]
  }

  statement {
    sid     = "SNSPermission"
    effect  = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = [
      "arn:${var.arn_region}:sns:*:*:${var.team}-*"
    ]
  }

  statement {
    sid     = "S3BucketPermission01"
    actions = [
      "s3:GetBucketLocation",
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    effect    = "Allow"
    resources = [
      "arn:${var.arn_region}:s3:::${var.team}-*",
      "arn:${var.arn_region}:s3:::${var.team}-*/*"
    ]
  }

  statement {
    sid     = "S3BucketPermission02"
    actions = [
      "s3:ListAllMyBuckets"
    ]
    effect    = "Allow"
    resources = [
      "arn:${var.arn_region}:s3:::*"
    ]
  }

  statement {
    sid     = "CloudwatchPermission01"
    actions = [
      "logs:CreateLogGroup"
    ]
    effect    = "Allow"
    resources = [
      "arn:${var.arn_region}:logs:*:*:*"
    ]
  }

  statement {
    sid     = "CloudwatchPermission02"
    actions = [
      "logs:PutLogEvents"
    ]
    effect    = "Allow"
    resources = [
      "arn:${var.arn_region}:logs:*:*:log-group:/aws/lambda/${var.team}-${var.bucket_id}-${var.environment}-${var.aws_region}:*"
    ]
  }
}

