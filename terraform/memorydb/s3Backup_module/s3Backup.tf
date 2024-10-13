
resource "aws_s3_bucket" "snapshot_bucket" {
  bucket = "${var.team}-${var.bucket_id}-${var.environment}-${var.aws_region}"
  tags   = tomap(var.default_tags)
}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.snapshot_bucket.id
  versioning_configuration {
    status     = "Enabled"
    mfa_delete = "Disabled"
  }
}

resource "aws_s3_bucket_public_access_block" "access_block" {
  bucket = aws_s3_bucket.snapshot_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "snapshot_log_bucket" {
  bucket = "${var.team}-log-${var.bucket_id}-${var.environment}-${var.aws_region}"
  tags   = tomap(var.default_tags)
}

resource "aws_s3_bucket_public_access_block" "access_block_log_bucket" {
  bucket = aws_s3_bucket.snapshot_log_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "log_bucket_acl_ownership" {
  bucket = aws_s3_bucket.snapshot_log_bucket.id
  rule {
    object_ownership = "ObjectWriter"
  }
}

resource "aws_s3_bucket_acl" "log_acl" {
  bucket     = aws_s3_bucket.snapshot_log_bucket.id
  acl        = "log-delivery-write"
  depends_on = [aws_s3_bucket_ownership_controls.log_bucket_acl_ownership]
}


resource "aws_s3_bucket_logging" "logging_bucket" {
  bucket        = aws_s3_bucket.snapshot_bucket.id
  target_bucket = aws_s3_bucket.snapshot_log_bucket.id
  target_prefix = "log/"
}

resource "aws_s3_bucket_lifecycle_configuration" "log-bucket-lifecycle" {
  bucket = aws_s3_bucket.snapshot_log_bucket.id

  rule {
    id     = "expire-objects-after-90-days"
    status = "Enabled"

    filter {
      prefix = "logs/"
    }

    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_policy" "redis_backup_bucket_policies" {
  bucket = aws_s3_bucket.snapshot_bucket.id
  policy = data.aws_iam_policy_document.memorydb_backup_bucket_policies.json
}

data "aws_iam_policy_document" "memorydb_backup_bucket_policies" {
  statement {
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:*"
    ]

    resources = [
      aws_s3_bucket.snapshot_bucket.arn,
      "${aws_s3_bucket.snapshot_bucket.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = [
        "false"
      ]
    }
  }

  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logging.s3.amazonaws.com"]
    }

    actions = [
      "s3:PutObject"
    ]

    resources = [
      "${aws_s3_bucket.snapshot_bucket.arn}/Logs/*"
    ]

    condition {
      test     = "ArnLike"
      variable = "aws:SourceARN"
      values   = [
        "${aws_s3_bucket.snapshot_bucket.arn}"
      ]
    }
  }

  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["${var.aws_region}.memorydb-snapshot.amazonaws.com"]
    }

    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:GetBucketAcl",
      "s3:ListMultipartUploadParts",
      "s3:ListBucketMultipartUploads"
    ]

    resources = [
      aws_s3_bucket.snapshot_bucket.arn,
      "${aws_s3_bucket.snapshot_bucket.arn}/*"
    ]
  }
}

resource "aws_s3_bucket_policy" "redis_backup_log_bucket_policies" {
  bucket = aws_s3_bucket.snapshot_log_bucket.id
  policy = data.aws_iam_policy_document.memorydb_backup_log_bucket_policies.json
}

data "aws_iam_policy_document" "memorydb_backup_log_bucket_policies" {
  statement {
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:*"
    ]

    resources = [
      aws_s3_bucket.snapshot_log_bucket.arn,
      "${aws_s3_bucket.snapshot_log_bucket.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = [
        "false"
      ]
    }
  }

  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logging.s3.amazonaws.com"]
    }

    actions = [
      "s3:PutObject"
    ]

    resources = [
      "${aws_s3_bucket.snapshot_log_bucket.arn}/Logs/*"
    ]

    condition {
      test     = "ArnLike"
      variable = "aws:SourceARN"
      values   = [
        "${aws_s3_bucket.snapshot_log_bucket.arn}"
      ]
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "encryption_bucket" {
  bucket = aws_s3_bucket.snapshot_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "encryption_log_bucket" {
  bucket = aws_s3_bucket.snapshot_log_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

module "lambda" {
  source                   = "../lambda_module"
  team                     = var.team
  environment              = var.environment
  region                   = var.region
  aws_region               = var.aws_region
  arn_region               = var.arn_region
  event_rule_schedule      = var.event_rule_schedule
  snapshot_retention_limit = var.snapshot_retention_limit
  sns_users                = var.sns_users
  default_tags             = var.default_tags
}